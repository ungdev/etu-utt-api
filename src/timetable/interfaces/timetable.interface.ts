/**
 * Represents a single occurence in the timetable.
 * The main difference between this and the TimetableEntry is that the TimetableOccurence doesn't contain metadata about this occurrence (override, repeat, ...)
 */
export interface TimetableOccurrence {
  /**
   * The id of the id of the entry this occurrence is built on
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
