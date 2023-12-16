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
      // We first add some useful values to the entries, that will be useful in the filter and later
      // The filter is actually done in the map : if, from the value we compute, we conclude that this event cannot be returned,
      // we don't return the entry. The filter method is then really easy
      .map((entry) => {
        const repeatEvery = entry.repeatEvery ?? Number.POSITIVE_INFINITY;
        let firstOccurrenceIndex = Math.floor((from.getTime() - entry.eventStart.getTime()) / repeatEvery);
        let firstOccurrenceStart = new Date(entry.eventStart.getTime() + firstOccurrenceIndex * entry.repeatEvery);
        if (firstOccurrenceIndex < entry.occurrencesCount && firstOccurrenceStart.getTime() + entry.occurrenceDuration >= from.getTime()) {
          return {
            entry,
            computedData: { repeatEvery, firstOccurrenceIndex, firstOccurrenceStart },
          };
        }
        // There still may be a next occurrence that will satisfy the required criteria
        firstOccurrenceIndex++;
        firstOccurrenceStart = new Date(firstOccurrenceStart.getTime() + repeatEvery);
        if (firstOccurrenceIndex < entry.occurrencesCount && firstOccurrenceStart < selectTo) {
          return {entry, computedData: {repeatEvery, firstOccurrenceIndex, firstOccurrenceStart}};
        }
        return null;
      }).filter((entry) => !!entry);
    // Create the occurrences. First, they will only be composed of the primary one.
    // They will then be updated by the non-primary ones
    const occurrences: TimetableOccurrence[] = [];
    const entryIds = []; // The original id of the entry of the occurrence of index i will be stored at index i in this array
    for (const entry of entries) {
      // Skip entry if it's not primary
      // Add every occurrence of this entry in the time range given
      let occurrenceIndex = entry.computedData.firstOccurrenceIndex;
      let occurrenceStart = entry.computedData.firstOccurrenceStart;
      while (occurrenceIndex < entry.entry.occurrencesCount && occurrenceStart < selectTo) {
        occurrences.push({
          entryId: entry.entry.id,
          index: occurrenceIndex,
          start: occurrenceStart,
          end: new Date(occurrenceStart.getTime() + entry.computedData.repeatEvery),
          location: entry.entry.location,
        });
        entryIds.push(entry.entry.id);
        occurrenceStart = new Date(occurrenceStart.getTime() + entry.computedData.repeatEvery);
        occurrenceIndex++;
      }
    }
    const overrides = (
      await this.prisma.timetableEntryOverride.findMany({
        where: {
          OR: occurrences.map((occurrence) => ({
            overrideTimetableEntry: { id: occurrence.entryId },
            applyFrom: { lte: occurrence.index },
            applyUntil: { gte: occurrence.index },
          })),
          timetableGroup: { userTimetableGroups: { some: { userId } } },
        },
        include: { timetableGroup: { select: { userTimetableGroups: { where: { userId }, take: 1 } } } },
      })
    )
      // Sort entries by priority, then by event length
      .sort((override1, override2) => {
        const priorityDifference =
          override1.timetableGroup.userTimetableGroups[0].priority -
          override2.timetableGroup.userTimetableGroups[0].priority;
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
        return override1.createdAt.getTime() - override2.createdAt.getTime();
      });
    // Update the newly created occurrences
    for (const override of overrides) {
      // If this is a primary entry, skip it
      if (!override.overrideTimetableEntryId) continue;
      let occurrencePosition = entryIds.findIndex((e) => e === override.overrideTimetableEntryId);
      do {
        const occurrence = occurrences[occurrencePosition];
        const occurrenceIndex = occurrence.index - override.applyFrom;
        if (occurrenceIndex > override.applyUntil) {
          continue;
        }
        const occurrenceStart = new Date(occurrence.start.getTime() + override.occurrenceRelativeStart);
        const occurrenceEnd = new Date(occurrenceStart.getTime() + override.occurrenceDuration);
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
      } while (
        occurrencePosition < occurrences.length - 1 &&
        entryIds[occurrencePosition].entryId === entryIds[++occurrencePosition].entryId
      );
    }
    return occurrences;
  }
}
