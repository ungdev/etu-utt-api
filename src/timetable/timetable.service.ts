import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DetailedTimetableEntry,
  TimetableEntryGroupForUser,
  TimetableEntryOccurrence,
} from './interfaces/timetable.interface';
import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup } from '../prisma/types';
import { omit } from '../utils';
import TimetableCreateEntryReqDto from './dto/req/timetable-create-entry-req.dto';
import TimetableUpdateEntryReqDto from './dto/req/timetable-update-entry-req.dto';
import TimetableDeleteOccurrencesReqDto from './dto/req/timetable-delete-occurrences-req.dto';

/**
 * The inclusions to use when fetching a {@link DetailedTimetableEntry}.
 * @param userId The id of the user for whose we want to fetch the entry.
 */
const detailedEntryInclusions = (userId: string) => ({
  overwrittenBy: {
    where: { timetableGroups: { some: { userTimetableGroups: { some: { userId } } } } },
    include: {
      timetableGroups: { where: { userTimetableGroups: { some: { userId } } }, select: { id: true } },
    },
  },
  timetableGroups: { where: { userTimetableGroups: { some: { userId } } }, select: { id: true } },
});

/**
 * Service for everything related to timetables.
 */
@Injectable()
export default class TimetableService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the {@link TimetableEntryOccurrence}s for the user for the next 24 hours.
   * This does exactly the same as calling the {@link getTimetableOfUserInNextXMs} function, with millis set to 24h
   * @param userId The id of the {@link User} we want to fetch the timetable.
   * @param from The Date from which the {@link TimetableEntryOccurrence}s will be fetched.
   * @return {Promise<TimetableEntryOccurrence[]>}
   * @see getTimetableOfUserInNextXMs
   */
  async getTimetableOfUserInNext24h(userId: string, from: Date): Promise<TimetableEntryOccurrence[]> {
    return this.getTimetableOfUserInNextXMs(userId, from, 24 * 3_600_000);
  }

  /**
   * Returns the [@link TimetableOccurrence}s for the user in a given interval of time.
   * The occurrences do not need to be contained in this interval of time, they need to overlap with it.
   * @param userId The id of the {@link User} we want to fetch the timetable of.
   * @param selectFrom The beginning of the interval.
   * @param millis The size of the interval.
   * @return {Promise<TimetableEntryOccurrence[]>}
   */
  async getTimetableOfUserInNextXMs(
    userId: string,
    selectFrom: Date,
    millis: number,
  ): Promise<TimetableEntryOccurrence[]> {
    // The end of the interval
    const selectTo = new Date(selectFrom.getTime() + millis);
    // First, fetch all TimetableEntry, filter and format them
    const entries: Array<{
      entry: RawTimetableEntry;
      computedData: { repeatEvery: number; firstOccurrenceIndex: number; firstOccurrenceStart: Date };
    }> = (
      await this.prisma.timetableEntry.findMany({
        where: {
          timetableGroups: { some: { userTimetableGroups: { some: { userId } } } }, // For user
          eventStart: { lte: selectTo }, // Select only events that start occurring before the end of the interval
        },
      })
    )
      // Filter entries that will not appear in the next X seconds.
      // An event begins in the next X milliseconds if (now - start) % repeat is less than X.
      // We don't compare directly with X, since we also need to take into account the end hour of the occurrence
      // (the occurrence could have started, but not ended, and we would still want to return it).
      // We first add some useful values to the entries, that will be useful in the filter and later.
      // The filter is actually done in the map : if, from the value we compute, we conclude that this event cannot be returned,
      // we don't return the entry. The filter method is then really easy.
      .map((entry) => {
        // If repeatEvery is not specified, the event doesn't repeat, ie there is an infinite time between 2 repetitions.
        const repeatEvery = entry.repeatEvery ?? Number.POSITIVE_INFINITY;
        // Compute some info about the last occurrence that started before the beginning of the interval.
        let firstOccurrenceIndex = Math.max(
          0,
          Math.floor((selectFrom.getTime() - entry.eventStart.getTime()) / repeatEvery),
        );
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
    const occurrences: Array<TimetableEntryOccurrence | null> = [];
    // The original id of the entry of the occurrence at index i and its occurrenceIndex will be stored at index i in this array.
    // We need to back up this information, to be able to link a TimetableOccurrence to a TimetableEntry
    const occurrencesNoOverride: Array<TimetableEntryOccurrence> = [];
    for (const entry of entries) {
      // Add every occurrence of this entry in the time range given.
      // We will go from one occurrence to the next, and add them one by one to the list,
      // until there is no occurrence left, or we reached the end of the interval.
      let occurrenceIndex = entry.computedData.firstOccurrenceIndex;
      let occurrenceStart = entry.computedData.firstOccurrenceStart;
      while (occurrenceIndex < entry.entry.occurrencesCount && occurrenceStart < selectTo) {
        const occurrence: TimetableEntryOccurrence = {
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
        timetableGroups: { some: { userTimetableGroups: { some: { userId } } } }, // The override concerns the user.
      },
      include: {
        timetableGroups: {
          where: { userTimetableGroups: { some: { userId } } },
          select: { userTimetableGroups: { where: { userId } } },
        },
      },
    });
    // Sort overrides by priority, then by creation date in ascending order.
    overrides.mappedSort((e) => [
      Math.max(...e.timetableGroups.map((group) => group.userTimetableGroups[0].priority)),
      e.createdAt.getTime(),
    ]);
    // Update the occurrences.
    for (const override of overrides) {
      // In this part we will mostly use occurrencesNoOverride, because we need to have access to the values before they were overridden.
      // We fetch the position in the array of the first occurrence of the entry we are overriding.
      let occurrencePosition = occurrencesNoOverride.findIndex((e) => e.entryId === override.overrideTimetableEntryId);
      // If the override should start after this occurrence, move to the first occurrence where it will apply.
      if (occurrencesNoOverride[occurrencePosition].index < override.applyFrom) {
        occurrencePosition += override.applyFrom - occurrencesNoOverride[occurrencePosition].index;
      }
      // If the override starts applying from this occurrence or an earlier one, we may not need to override the occurrence (can happen if repeatEvery is not 1).
      // We will move our cursor to the first occurrence after the current one (or the current one) that this override should update.
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
      // Then the resulting occurrence that was originally at index 3 will now have index 0.
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
              end: new Date(
                override.occurrenceDuration !== null ? occurrenceStart.getTime() + override.occurrenceDuration :
                  (occurrences[occurrencePosition] ?? occurrencesNoOverride[occurrencePosition]).end.getTime() -
                    (occurrences[occurrencePosition] ?? occurrencesNoOverride[occurrencePosition]).start.getTime(),
              ),
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
    return occurrences.filter((occurrence) => occurrence !== null).mappedSort((e) => [e.start, e.end, e.entryId]);
  }

  /**
   * Fetches the entry override with the given id.
   * @param overrideId The id of the override we want to fetch
   * @return {Promise<RawTimetableEntryOverride>}
   */
  async fetchEntryOverride(overrideId: string): Promise<RawTimetableEntryOverride> {
    return this.prisma.timetableEntryOverride.findUnique({
      where: { id: overrideId },
    });
  }

  /**
   * Fetches the entry with the given id for the given user, and returns a detailed version of it.
   * @param entryId The id of the entry we want to fetch
   * @param userId The id of the user we want to fetch the entry for (used to filter groups and overrides)
   * @param method The prisma method to call to fetch the entry (depending on whether you want to delete the entry or only fetch it). Defaults to 'findUnique'.
   * @return {Promise<DetailedTimetableEntry>}
   */
  async getEntryDetails(
    entryId: string,
    userId: string,
    method: 'findUnique' | 'delete' = 'findUnique',
  ): Promise<DetailedTimetableEntry> {
    const timetableEntry = await this.prisma.timetableEntry[method]({
      where: { id: entryId, timetableGroups: { some: { userTimetableGroups: { some: { userId } } } } },
      include: detailedEntryInclusions(userId),
    });
    if (!timetableEntry) return null;
    await this.sortOverridesAndGroups(timetableEntry, userId);
    return timetableEntry;
  }

  /**
   * Fetches the groups of the user.
   * @param userId The id of the user we want to fetch the groups for.
   * @return {Promise<TimetableEntryGroupForUser[]>}
   */
  async getTimetableGroups(userId: string): Promise<TimetableEntryGroupForUser[]> {
    return (
      await this.prisma.timetableGroup.findMany({
        where: { userTimetableGroups: { some: { userId } } },
        include: { userTimetableGroups: { where: { userId } } },
      })
    )
      .mappedSort((group1) => [group1.userTimetableGroups[0].priority, group1.createdAt])
      .map((group) => ({
        ...omit(group, 'userTimetableGroups'),
        priority: group.userTimetableGroups[0].priority,
      }));
  }

  /**
   * Creates a new entry in the timetable.
   * @param data The data of the entry to create.
   * @return {Promise<DetailedTimetableEntry>}
   */
  async createTimetableEntry(data: TimetableCreateEntryReqDto): Promise<DetailedTimetableEntry> {
    const timetableEntry = {
      ...(await this.prisma.timetableEntry.create({
        data: {
          location: data.location,
          occurrenceDuration: data.duration,
          eventStart: data.firstRepetitionDate,
          repeatEvery: data.repetitionFrequency,
          occurrencesCount: data.repetitions,
          timetableGroups: { connect: data.groups.map((groupId) => ({ id: groupId })) },
          type: 'CUSTOM',
        },
        include: {
          timetableGroups: { select: { id: true } },
        },
      })),
      overwrittenBy: [],
    };
    await this.sortOverridesAndGroups(timetableEntry);
    return timetableEntry;
  }

  /**
   * Updates an entry in the timetable.
   * @param entryId The id of the entry to update.
   * @param data The data to update the entry with.
   * @param userId The id of the user we want to update the entry for.
   * @return {Promise<DetailedTimetableEntry>} or null if the entry was not found.
   */
  async updateTimetableEntry(
    entryId: string,
    data: TimetableUpdateEntryReqDto,
    userId: string,
  ): Promise<DetailedTimetableEntry> {
    // Find the entry.
    const entry = await this.prisma.timetableEntry.findUnique({
      where: { id: entryId },
      include: { timetableGroups: { select: { id: true } } },
    });
    // We did not find the entry, return as we cannot do anything about it.
    if (!entry) {
      return null;
    }
    // If the update should apply to all groups of the entry and to all occurrences, creating an override is useless.
    // We should instead modify the entry directly.
    if (
      data.for.length === entry.timetableGroups.length &&
      data.for.every((groupId) => entry.timetableGroups.some((group) => group.id === groupId)) &&
      data.updateFrom === 0 &&
      data.updateUntil === entry.occurrencesCount - 1 &&
      data.applyEvery === 1
    ) {
      // Update the entry, format it and return it.
      const updatedEntry: DetailedTimetableEntry = await this.prisma.timetableEntry.update({
        where: { id: entryId },
        data: {
          location: data.location,
          occurrenceDuration: data.occurrenceDuration,
          eventStart: data.relativeStart ? new Date(entry.eventStart.getTime() + data.relativeStart) : undefined,
        },
        include: detailedEntryInclusions(userId),
      });
      await this.sortOverridesAndGroups(updatedEntry, userId);
      return updatedEntry;
    }
    // If we are here, we need to use an override.
    // First, try to find an override that matches the data.
    const override = (
      await this.prisma.timetableEntryOverride.findMany({
        where: {
          overrideTimetableEntryId: entryId,
          applyFrom: data.updateFrom,
          applyUntil: data.updateUntil,
          repeatEvery: data.applyEvery,
          timetableGroups: { every: { id: { in: data.for } } },
        },
        include: { timetableGroups: true },
      })
    )
      // We still need to verify that there aren't groups that are in the data but not in the override.
      .filter((override) => override.timetableGroups.length === data.for.length)[0];
    // If we found an override, update it, and fetch and return the formatted entry.
    if (override) {
      await this.prisma.timetableEntryOverride.update({
        where: { id: override.id },
        data: {
          location: data.location,
          occurrenceDuration: data.occurrenceDuration ?? undefined,
          occurrenceRelativeStart: data.relativeStart ?? undefined,
          delete: false,
        },
      });
      return this.getEntryDetails(entryId, userId);
    }
    // If we are here, no override matching the specified criteria match, we need to create one.
    await this.prisma.timetableEntryOverride.create({
      data: {
        applyFrom: data.updateFrom,
        applyUntil: data.updateUntil,
        repeatEvery: data.applyEvery,
        location: data.location,
        occurrenceDuration: data.occurrenceDuration,
        occurrenceRelativeStart: data.relativeStart,
        overrideTimetableEntryId: entryId,
        timetableGroups: { connect: data.for.map((groupId) => ({ id: groupId })) },
      },
    });
    // Fetch and return the formatted entry.
    return this.getEntryDetails(entryId, userId);
  }

  /**
   * Sorts the properties overwrittenBy, timetableGroups and overwrittenBy.timetableGroups of a {@link DetailedTimetableEntry}.
   * The changes are made in-place.
   * @param entry The entry to sort.
   * @param userId The id of the user we want to sort the entry for.
   *               This is used for optimization purposes, it is not needed to work. If you can, specify it.
   * @return {Promise<void>}
   */
  private async sortOverridesAndGroups(entry: DetailedTimetableEntry, userId: string = undefined): Promise<void> {
    // Information about the groups.
    // An object containing the group id as a key, and an object containing the priority and the creation date of the group as a value.
    const timetableGroupInfo: { [groupId: string]: { priority: number; createdAt: Date } } = Object.fromEntries(
      // Fetch the rows of the userTimetableGroup table that are linked to :
      // - one of the group of the entry,
      // - or one of the group of one of the override of the entry.
      // If userId is specified, we also filter by userId, to have fewer groups.
      (
        await this.prisma.userTimetableGroup.findMany({
          where: {
            userId,
            timetableGroup: {
              OR: [
                ...entry.timetableGroups.map((group) => ({ id: group.id })),
                // Take the row where the group id is one of the ids of one of the group of one of the override
                ...entry.overwrittenBy.map((override) => ({
                  OR: override.timetableGroups.map((group) => ({ id: group.id })),
                })),
              ],
            },
          },
          include: { timetableGroup: true },
        })
      )
        // We make a list of entries for the Object.fromEntries function.
        // The key is the id of the group, and the value is an object containing some data needed later about this group (priority and createdAt).
        .map((group) => [
          group.timetableGroupId,
          { priority: group.priority, createdAt: group.timetableGroup.createdAt },
        ]),
    );
    // Sort entry.overwrittenBy, by priority and creation date in descending order.
    entry.overwrittenBy.mappedSort((override) => [
      -Math.max(...override.timetableGroups.map((group) => timetableGroupInfo[group.id].priority)),
      -override.createdAt.getTime(),
    ]);
    // Sort entry.timetableGroups, by priority and creation date in descending order.
    entry.timetableGroups.mappedSort((group) => [
      -timetableGroupInfo[group.id].priority,
      -timetableGroupInfo[group.id].createdAt.getTime(),
    ]);
    // Sort entry.overwrittenBy.timetableGroups, by priority and creation date in descending order.
    for (const override of entry.overwrittenBy) {
      override.timetableGroups.mappedSort((group) => [
        -timetableGroupInfo[group.id].priority,
        -timetableGroupInfo[group.id].createdAt.getTime(),
      ]);
    }
  }

  /**
   * Whether a group exists.
   * @param groupId The id of the group to check.
   * @param userId The group must be for this user to consider it does exist.
   * @return {Promise<boolean>}
   */
  async groupExists(groupId: string, userId: string): Promise<boolean> {
    return (await this.prisma.userTimetableGroup.count({ where: { userId, timetableGroupId: groupId } })) > 0;
  }

  /**
   * Fetches the groups of the entry with the given id.
   * @param entryId The id of the entry we want to fetch the groups of.
   * @param userId The id of the user we want to fetch the groups for.
   * @return {Promise<RawTimetableGroup[]>}
   */
  async getTimetableGroupsOfEntry(entryId: string, userId: string): Promise<RawTimetableGroup[]> {
    return this.prisma.timetableGroup.findMany({
      where: { timetableEntries: { some: { id: entryId } }, userTimetableGroups: { some: { userId } } },
    });
  }

  /**
   * Whether an entry exists.
   * @param entryId The id of the entry to check.
   * @param userId The entry must be for this user to consider it does exist.
   * @return {Promise<boolean>}
   */
  async entryExists(entryId: string, userId: string): Promise<boolean> {
    return (
      (await this.prisma.timetableEntry.count({
        where: { id: entryId, timetableGroups: { some: { userTimetableGroups: { some: { userId } } } } },
      })) > 0
    );
  }

  /**
   * Deletes some occurrences of an entry.
   * @param entryId The id of the entry to delete the occurrences of.
   * @param data The information of what to delete.
   * @param userId The id of the user we want to delete the occurrences for.
   * @return {Promise<DetailedTimetableEntry>}
   */
  async deleteOccurrences(
    entryId: string,
    data: TimetableDeleteOccurrencesReqDto,
    userId: string,
  ): Promise<DetailedTimetableEntry> {
    // First, fetch the entry.
    const entry = await this.prisma.timetableEntry.findUnique({
      where: { id: entryId },
      include: { timetableGroups: { select: { id: true } } },
    });
    // If we need to delete every occurrence of the entry for all the groups of the entry, we can just delete the entry.
    if (
      entry.timetableGroups.length === data.for.length &&
      data.for.every((groupId) => entry.timetableGroups.some((group) => group.id === groupId)) &&
      data.from === 0 &&
      data.until === entry.occurrencesCount - 1 &&
      data.every === 1
    ) {
      return await this.getEntryDetails(entryId, userId, 'delete');
    }
    // If we are here, we need to use an override.
    // Find an override that overrides the right occurrences for the right groups, if there exists one.
    const override = (
      await this.prisma.timetableEntryOverride.findMany({
        where: {
          overrideTimetableEntryId: entryId,
          applyFrom: data.from,
          applyUntil: data.until,
          repeatEvery: data.every,
          timetableGroups: { every: { id: { in: data.for } } },
        },
        include: { timetableGroups: true },
      })
    )
      // We still need to verify that there aren't groups that are in the data but not in the override.
      .filter((override) => override.timetableGroups.length === data.for.length)[0];
    // If such an override exists, update it.
    if (override) {
      await this.prisma.timetableEntryOverride.update({
        where: { id: override.id },
        data: { delete: true },
      });
      return this.getEntryDetails(entryId, userId);
    }
    // Else, create a new override matching the given data.
    await this.prisma.timetableEntryOverride.create({
      data: {
        applyFrom: data.from,
        applyUntil: data.until,
        repeatEvery: data.every,
        delete: true,
        overrideTimetableEntryId: entryId,
        timetableGroups: { connect: data.for.map((groupId) => ({ id: groupId })) },
      },
    });
    return this.getEntryDetails(entryId, userId);
  }
}
