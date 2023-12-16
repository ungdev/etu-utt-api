import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableEntry, TimetableOccurrence } from './interfaces/timetable.interface';

@Injectable()
export default class TimetableService {
  constructor(private prisma: PrismaService) {}

  async getTimetableOfUserInNext24h(userId: string, from: Date): Promise<TimetableEntry[]> {
    return this.getTimetableOfUserInNextXSeconds(userId, from, 24 * 3600);
  }

  async getTimetableOfUserInNextXSeconds(userId: string, from: Date, seconds: number): Promise<TimetableEntry[]> {
    const selectTo = new Date(from.getTime() + seconds);
    const entries = (
      await this.prisma.timetableEntry.findMany({
        where: {
          timetableGroup: { userTimetableGroups: { some: { userId } } },
          eventStart: { lte: selectTo },
          eventEnd: { gte: from },
        },
        include: { timetableGroup: { select: { userTimetableGroups: { where: { userId }, take: 1 } } } },
      })
    )
      // Filter entries that will not appear in the next X seconds
      // An event begins in the next X seconds if (now - start) % repeat is less than X
      // We don't compare directly with X, since we also need to take into account the end hour of the occurrence
      // (the occurrence could have started, but not ended, and we would still want to return it)
      .filter(
        (entry) =>
          (from.getTime() - entry.eventStart.getTime()) % (entry.repeatEvery ?? Number.POSITIVE_INFINITY) <
          seconds + entry.occurrenceDuration,
      )
      // Sort entries by priority, then by event length
      .sort((entry1, entry2) => {
        const priorityDifference =
          entry1.timetableGroup.userTimetableGroups[0].priority - entry2.timetableGroup.userTimetableGroups[1].priority;
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
        return (
          entry1.eventEnd.getTime() -
          entry1.eventStart.getTime() -
          (entry2.eventEnd.getTime() - entry2.eventStart.getTime())
        );
      });
    // Create the occurrences. First, they will only be composed of the primary one.
    // They will then be updated by the non-primary ones
    const occurrences: TimetableOccurrence[] = [];
    for (const entry of entries) {
      // Skip entry if it's not primary
      if (entry.overrideTimetableEntryId) {
        continue;
      }
      const repeatEvery = entry.repeatEvery ?? Number.POSITIVE_INFINITY;
      // Add every occurrence of this entry in the time range given
      let occurrenceId = Math.floor((from.getTime() - entry.eventStart.getTime()) / repeatEvery);
      let occurrenceStart = new Date(entry.eventStart.getTime() + repeatEvery * occurrenceId);
      while (occurrenceStart < entry.eventEnd && occurrenceStart < selectTo) {
        occurrences.push({
          id: entry.id,
          occurrenceId,
          start: occurrenceStart,
          end: new Date(occurrenceStart.getTime() + repeatEvery),
          location: entry.location,
        });
        occurrenceStart = new Date(occurrenceStart.getTime() + repeatEvery);
        occurrenceId++;
      }
    }
    // Update the newly created occurrences
    for (const entry of entries) {
      // If this is a primary entry, skip it
      if (!entry.overrideTimetableEntryId) continue;
      let occurrenceIndex = occurrences.findIndex((e) => e.id === entry.overrideTimetableEntryId);
      if (occurrenceIndex === -1) {
        // This should never happen : user X is not concerned about entry A, but is concerned about entry B, and entry B overwrites entry A
        console.warn('User is concerned about overwritting an event they are not concerned about');
        continue;
      }
      do {
        const occurrence = occurrences[occurrenceIndex];
        if (occurrence.end < entry.eventStart || occurrence.start > entry.eventEnd) {
          continue;
        }
        // If the override deletes the occurrence, well, do it.
        // And also decrease occurrenceIndex by one as the next item will have an index one less than before.
        if (entry.type === 'DELETE') {
          occurrences.splice(occurrenceIndex, 1);
          occurrenceIndex--;
        }
        occurrences[occurrenceIndex] = {
          ...occurrence,
          id: entry.id,
          occurrenceId: Math.floor((from.getTime() - entry.eventStart.getTime()) / entry.repeatEvery),
          location: entry.location ?? occurrence.location,
        };
      } while (occurrences[occurrenceIndex].id === occurrences[++occurrenceIndex].id);
    }
    return entries;
  }
}
