import { RawTimetableEntry } from '../../prisma/types';

export type TimetableEntry = Omit<
  RawTimetableEntry,
  'overrideTimetableEntryId' | 'eventId' | 'ueCourseId' | 'timetableGroupId'
>;
