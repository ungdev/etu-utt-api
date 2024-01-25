import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup } from '../../prisma/types';

/**
 * Represents a single occurrence in the timetable.
 * The main difference between this and the TimetableEntry is that the TimetableOccurrence doesn't contain metadata about this occurrence (override, repeat, ...)
 */
export interface TimetableEntryOccurrence {
  /**
   * The id of the entry this occurrence is built on.
   */
  entryId: string;
  /**
   * The index of the occurrence of the entry this occurrence is built on.
   * For example, let's consider an event happening every two days at 8am from September, 1st
   * Then September, 1st would have occurrenceId 0, September, 3rd would have occurrenceId 1, September 5th would have occurrenceId 2, and so on
   */
  index: number;
  /**
   * The moment this occurrence begins
   */
  start: Date;
  /**
   * The moment this occurrence ends
   */
  end: Date;
  /**
   * Where this occurrence will take place
   */
  location: string;
}

/**
 * Represents an entry with group ids and detailed overrides.
 * This should be created for a specific user (as we don't store all the overrides for example, only the ones that concern the user)
 */
export interface DetailedTimetableEntry extends RawTimetableEntry {
  /**
   * The ids of the groups this entry is for.
   * The groups should be sorted by priority (for the given user), and then creation date, both in descending order.
   */
  timetableGroups: Array<{ id: string }>;
  /**
   * The overrides of this entry.
   * The overrides should be sorted by the maximum priority a group of this override has (for the given user), and then by creation date, both in descending order.
   * The groups of the overrides should be sorted by priority (for the given user), and then creation date, both in descending order. The sorting is exactly the same as for the groups of the entry.
   */
  overwrittenBy: Array<RawTimetableEntryOverride & { timetableGroups: Array<{ id: string }> }>;
}

/**
 * The type representing a detailed entry when sending it.
 */
export interface ResponseDetailedTimetableEntry {
  id: string;
  location: string;
  duration: number;
  firstRepetitionDate: Date;
  lastRepetitionDate: Date;
  repetitionFrequency: number;
  repetitions: number;
  groups: string[];
  overrides: Array<{
    id: string;
    location: string;
    firstRepetitionDate: Date;
    lastRepetitionDate: Date;
    firstOccurrenceOverride: number;
    lastOccurrenceOverride: number;
    overrideFrequency: number;
    groups: string[];
    deletion: boolean;
  }>;
}

/**
 * A group with a priority.
 * This group should be associated with a specific user, as the priority is user-specific.
 */
export type TimetableEntryGroupForUser = RawTimetableGroup & { priority: number };
