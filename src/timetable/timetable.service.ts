import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableOccurrence } from './interfaces/timetable.interface';
import { RawTimetableEntry } from '../prisma/types';
import { sortArray } from '../utils';

/**
 * Service for everything related to timetables.
 */
@Injectable()
export default class TimetableService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the {@link TimetableOccurrence}s for the user for the next 24 hours.
   * This does exactly the same as calling the {@link getTimetableOfUserInNextXMs} function, with millis set to 24h
   * @param userId The id of the {@link User} we want to fetch the timetable.
   * @param from The Date from which the {@link TimetableOccurrence}s will be fetched.
   * @see getTimetableOfUserInNextXMs
   */
  async getTimetableOfUserInNext24h(userId: string, from: Date): Promise<TimetableOccurrence[]> {
    return this.getTimetableOfUserInNextXMs(userId, from, 24 * 3_600_000);
  }

  /**
   * Returns the [@link TimetableOccurrence}s for the user in a given interval of time.
   * The occurrences do not need to be contained in this interval of time, they need to overlap with it.
   * @param userId The id of the {@link User} we want to fetch the timetable of.
   * @param selectFrom The beginning of the interval.
   * @param millis The size of the interval.
   */
  async getTimetableOfUserInNextXMs(userId: string, selectFrom: Date, millis: number): Promise<TimetableOccurrence[]> {
    // The end of the interval
    const selectTo = new Date(selectFrom.getTime() + millis);
    // First, fetch all TimetableEntry, filter and format them
    const entries: Array<{
      entry: RawTimetableEntry;
      computedData: { repeatEvery: number; firstOccurrenceIndex: number; firstOccurrenceStart: Date };
    }> = (
      await this.prisma.timetableEntry.findMany({
        where: {
          timetableGroup: { userTimetableGroups: { some: { userId } } }, // For user
          eventStart: { lte: selectTo }, // Select only events that start occurring before the end of the interval
        },
        include: { timetableGroup: { select: { userTimetableGroups: { where: { userId }, take: 1 } } } },
      })
    )
      // Filter entries that will not appear in the next X seconds.
      // An event begins in the next X seconds if (now - start) % repeat is less than X.
      // We don't compare directly with X, since we also need to take into account the end hour of the occurrence
      // (the occurrence could have started, but not ended, and we would still want to return it).
      // We first add some useful values to the entries, that will be useful in the filter and later.
      // The filter is actually done in the map : if, from the value we compute, we conclude that this event cannot be returned,
      // we don't return the entry. The filter method is then really easy.
      .map((entry) => {
        // If repeatEvery is not specified, the event doesn't repeat, ie there is an infinite time between 2 repetitions.
        const repeatEvery = entry.repeatEvery ?? Number.POSITIVE_INFINITY;
        // Compute some info about the last occurrence that started before the beginning of the interval.
        let firstOccurrenceIndex = Math.floor((selectFrom.getTime() - entry.eventStart.getTime()) / repeatEvery);
        let firstOccurrenceStart = new Date(entry.eventStart.getTime() + firstOccurrenceIndex * entry.repeatEvery);
        // If this occurrence really exists and overlaps with the interval, that's the first occurrence of this event in the interval.
        if (
          firstOccurrenceIndex < entry.occurrencesCount &&
          firstOccurrenceStart.getTime() + entry.occurrenceDuration >= selectFrom.getTime()
        ) {
          return {
            entry,
            computedData: { repeatEvery, firstOccurrenceIndex, firstOccurrenceStart },
          };
        }
        // The occurrence may not overlap with the interval.
        // In that case, there still may be a next occurrence that will satisfy the required criteria
        firstOccurrenceIndex++;
        firstOccurrenceStart = new Date(firstOccurrenceStart.getTime() + repeatEvery);
        // This time, we know the occurrence started after the beginning of the interval.
        // We only need to check that it does not start after the end, in which case it won't overlap with the interval.
        if (firstOccurrenceIndex < entry.occurrencesCount && firstOccurrenceStart < selectTo) {
          return { entry, computedData: { repeatEvery, firstOccurrenceIndex, firstOccurrenceStart } };
        }
        // There is no overlap between the entry and the interval
        return null;
      })
      .filter((entry) => !!entry);
    // Create the occurrences. First, they will only be composed of the primary one (TimetableEntry)
    // They will then be updated by the non-primary ones (TimetableEntryOverride)
    // The order of occurrences is important : all occurrences from a single TimetableEntry are all one after another,
    // and sorted by ascending index in a single TimetableEntry stretch
    const occurrences: Array<TimetableOccurrence | null> = [];
    // The original id of the entry of the occurrence at index i and its occurrenceIndex will be stored at index i in this array.
    // We need to back up this information, to be able to link a TimetableOccurrence to a TimetableEntry
    const occurrencesNoOverride: Array<TimetableOccurrence> = [];
    for (const entry of entries) {
      // Skip entry if it's not primary.
      // Add every occurrence of this entry in the time range given.
      // We will go from one occurrence to the next, and add them one by one to the list,
      // until there is no occurrence left or we reached the end of the interval.
      let occurrenceIndex = entry.computedData.firstOccurrenceIndex;
      let occurrenceStart = entry.computedData.firstOccurrenceStart;
      while (occurrenceIndex < entry.entry.occurrencesCount && occurrenceStart < selectTo) {
        const occurrence: TimetableOccurrence = {
          entryId: entry.entry.id,
          index: occurrenceIndex,
          start: occurrenceStart,
          end: new Date(occurrenceStart.getTime() + entry.entry.occurrenceDuration),
          location: entry.entry.location,
        };
        occurrences.push(occurrence);
        occurrencesNoOverride.push({ ...occurrence });
        occurrenceStart = new Date(occurrenceStart.getTime() + entry.computedData.repeatEvery);
        occurrenceIndex++;
      }
    }
    // Now, fetch all TimetableEntryOverride linked to one of the TimetableEntry we fetched earlier.
    const overrides = await this.prisma.timetableEntryOverride.findMany({
      where: {
        OR: occurrences.map((occurrence) => ({
          overrideTimetableEntry: { id: occurrence.entryId }, // Linked to a TimetableEntry we fetched.
          applyFrom: { lte: occurrence.index }, // The TimetableOccurrence it is linked to is in the interval of occurrences overwritten.
          applyUntil: { gte: occurrence.index },
        })),
        timetableGroup: { userTimetableGroups: { some: { userId } } }, // The override concerns the user.
      },
      include: { timetableGroup: { select: { userTimetableGroups: { where: { userId }, take: 1 } } } },
    });
    // Sort overrides by priority, then by creation date in ascending order.
    sortArray(overrides, (e) =>
      e.timetableGroup !== null ? [e.timetableGroup.userTimetableGroups[0].priority, e.createdAt.getTime()] : [],
    );
    // Update the occurrences.
    for (const override of overrides) {
      // In this part we will mostly use occurrencesNoOverride, because we need to have access to the values before they were overwritten.
      // We fetch the position in the array of the first occurrence of the entry we are overriding.
      let occurrencePosition = occurrencesNoOverride.findIndex((e) => e.entryId === override.overrideTimetableEntryId);
      // If the override is not applied for this occurrence yet, move to the first occurrence where it will be.
      if (occurrencesNoOverride[occurrencePosition].index < override.applyFrom) {
        occurrencePosition += override.applyFrom - occurrencesNoOverride[occurrencePosition].index;
      } // If it was, we may not need to override the occurrence (can happen if repeatEvery is not 1). Then, move to the first overridable occurence.
      else {
        const offsetFromLastOverrideOccurrence =
          (occurrencesNoOverride[occurrencePosition].index - override.applyFrom) % override.repeatEvery;
        if (offsetFromLastOverrideOccurrence !== 0) {
          occurrencePosition += override.repeatEvery - offsetFromLastOverrideOccurrence;
        }
      }
      // If we are now out of bound, go to the next override.
      if (occurrencePosition >= occurrencesNoOverride.length) {
        continue;
      }
      // This is the index of the occurrence of the override.
      // For example, let's consider a TimetableEntryOverride that overrides the occurrences of a TimetableEntry from index 3 to 5.
      // Then the resulting occurrence that was originally at index 3 will now have index
      let occurrenceIndex =
        (occurrencesNoOverride[occurrencePosition].index - override.applyFrom) / override.repeatEvery;
      // We keep modifying occurrences until one of these 3 conditions is met :
      //   - We reached the end of the array of occurrences
      //   - We have reached the end of the list of occurrences for the TimetableEntry we are overriding
      //   - We have reached the end of the range of occurrences that the TimetableEntryOverride should modify
      while (
        occurrencePosition < occurrences.length &&
        occurrencesNoOverride[occurrencePosition].entryId === override.overrideTimetableEntryId &&
        occurrencesNoOverride[occurrencePosition].index <= override.applyUntil
      ) {
        const occurrenceStart = new Date(
          occurrencesNoOverride[occurrencePosition].start.getTime() + override.occurrenceRelativeStart,
        );
        // Don't delete the occurrence now, there may be another override somewhere else that will "undelete" it.
        occurrences[occurrencePosition] = override.delete
          ? null
          : {
              start: occurrenceStart,
              end: new Date(occurrenceStart.getTime() + override.occurrenceDuration),
              entryId: override.id,
              index: occurrenceIndex,
              location:
                override.location ??
                occurrences[occurrencePosition]?.location ??
                occurrencesNoOverride[occurrencePosition].location,
            };
        occurrencePosition += override.repeatEvery;
        occurrenceIndex++;
      }
    }
    // Finally, remove null values (occurrences that have been removed) and sort by start, end and then entryId
    return sortArray(
      occurrences.filter((occurrence) => occurrence !== null),
      (e) => [e.start, e.end, e.entryId],
    );
  }

  async fetchEntryOverride(overrideId: string) {
    return this.prisma.timetableEntryOverride.findUnique({
      where: { id: overrideId },
    });
  }

  async getEntryDetails(entryId: string, userId: string) {
    const timetableEntry = await this.prisma.timetableEntry.findUnique({
      where: { id: entryId, timetableGroup: { userTimetableGroups: { some: { userId } } } },
      include: {
        overwrittenBy: {
          where: { timetableGroup: { userTimetableGroups: { some: { userId } } } },
        },
        timetableGroup: true,
      },
    });
    if (!timetableEntry) return null;
    const timetableGroupPriorities: { [groupId: string]: { priority: number; createdAt: Date } } = Object.fromEntries(
      (
        await this.prisma.userTimetableGroup.findMany({
          where: {
            userId,
            timetableGroup: { OR: timetableEntry.overwrittenBy.map((override) => ({ id: override.timetableGroupId })) },
          },
          include: { timetableGroup: true },
        })
      ).map((group) => [
        group.timetableGroupId,
        { priority: group.priority, createdAt: group.timetableGroup.createdAt },
      ]),
    );
    sortArray(timetableEntry.overwrittenBy, (override) => [
      -timetableGroupPriorities[override.timetableGroupId].priority,
      -timetableGroupPriorities[override.timetableGroupId].createdAt,
    ]);
    return timetableEntry;
  }

  async getTimetableGroups(userId: string) {
    return sortArray(
      await this.prisma.timetableGroup.findMany({
        where: { userTimetableGroups: { some: { userId } } },
        include: { userTimetableGroups: { where: { userId } } },
      }),
      (group1) => [group1.userTimetableGroups[0].priority, group1.createdAt],
    );
  }
}