import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableOccurrence } from './interfaces/timetable.interface';

@Injectable()
export default class TimetableService {
  constructor(private prisma: PrismaService) {}

  async getTimetableOfUserInNext24h(userId: string, from: Date): Promise<TimetableOccurrence[]> {
    return this.getTimetableOfUserInNextXMs(userId, from, 24 * 3600);
  }

  async getTimetableOfUserInNextXMs(userId: string, from: Date, millis: number): Promise<TimetableOccurrence[]> {
    const selectTo = new Date(from.getTime() + millis);
    const entries = (
      await this.prisma.timetableEntry.findMany({
        where: {
          timetableGroup: { userTimetableGroups: { some: { userId } } },
          eventStart: { lte: selectTo },
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
          millis + entry.occurrenceDuration && from.getTime() < entry.eventStart.getTime() + entry.repeatEvery * (entry.occurrencesCount - 1)
      )
      // Sort entries by priority, then by event length
      .sort((entry1, entry2) => {
        const priorityDifference =
          entry1.timetableGroup.userTimetableGroups[0].priority - entry2.timetableGroup.userTimetableGroups[0].priority;
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
        return (
          entry1.repeatEvery * (entry1.occurrencesCount - 1) -
          entry2.repeatEvery * (entry2.occurrencesCount - 1)
        );
      });
    // Create the occurrences. First, they will only be composed of the primary one.
    // They will then be updated by the non-primary ones
    const occurrences: TimetableOccurrence[] = [];
    for (const entry of entries) {
      // Skip entry if it's not primary
      const repeatEvery = entry.repeatEvery ?? Number.POSITIVE_INFINITY;
      // Add every occurrence of this entry in the time range given
      let occurrenceIndex = Math.floor((from.getTime() - entry.eventStart.getTime()) / repeatEvery);
      let occurrenceStart = new Date(entry.eventStart.getTime() + repeatEvery * occurrenceIndex);
      while (occurrenceIndex < entry.occurrencesCount && occurrenceStart < selectTo) {
        occurrences.push({
          entryId: entry.id,
          index: occurrenceIndex,
          start: occurrenceStart,
          end: new Date(occurrenceStart.getTime() + repeatEvery),
          location: entry.location,
        });
        occurrenceStart = new Date(occurrenceStart.getTime() + repeatEvery);
        occurrenceIndex++;
      }
    }
    const overrides = await this.prisma.timetableEntryOverride.findMany({
      where: {OR: occurrences.map(e => ({overrideTimetableEntry: {id: e.entryId}, applyFrom: { lte: e.index }, applyUntil: {gte: e.index}})),}
    });
    // Update the newly created occurrences
    for (const override of overrides) {
      // If this is a primary entry, skip it
      if (!override.overrideTimetableEntryId) continue;
      let occurrencePosition = occurrences.findIndex((e) => e.entryId === override.overrideTimetableEntryId);
      do {
        const occurrence = occurrences[occurrencePosition];
        let occurrenceIndex = occurrence.index - override.applyFrom;
        if (occurrenceIndex > override.applyUntil) {
          continue;
        }
        let occurrenceStart = new Date(occurrence.start.getTime() + override.occurrenceRelativeStart);
        let occurrenceEnd = new Date(occurrenceStart.getTime() + override.occurrenceDuration);
        // If the override deletes the occurrence, well, do it.
        // And also decrease occurrenceIndex by one as the next item will have an index one less than before.
        if (override.delete) {
          occurrences.splice(occurrencePosition, 1);
          occurrencePosition--;
        } else {
          occurrences[occurrencePosition] = {
            start: occurrenceStart,
            end: occurrenceEnd,
            entryId: override.id,
            index: occurrenceIndex,
            location: override.location ?? occurrence.location,
          };
        }
      } while (occurrencePosition < occurrences.length - 1 && occurrences[occurrencePosition].entryId === occurrences[++occurrencePosition].entryId);
    }
    return occurrences;
  }
}
