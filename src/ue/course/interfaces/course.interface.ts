import { CourseEvent } from 'src/timetable/interfaces/ical.interface';

export interface UeCourse {
  /**
   * The code of the ue
   * e.g. MT01
   */
  ueCode: string;

  /**
   * The semester id of the course
   * e.g. A24
   */
  semesterId: string;

  /**
   * The type of course
   */
  type: 'CM' | 'TD' | 'TP';

  /**
   * The course timetable entry data
   */
  timetableEntry: CourseEvent;
}
