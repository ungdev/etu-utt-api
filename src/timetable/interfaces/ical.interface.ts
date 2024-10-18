/**
 * Represents an course parsed from an iCalendar file
 * This event should represent an unique course entry repeated every week
 */
export interface CourseEvent {
  /**
   * An id shared by all event occurences.
   * Tells if an occurence is part of the course
   */
  shared_id: string;

  /**
   * Where the course takes place
   */
  location: string;

  /**
   * The course name.
   * For example: A24_MT01_FR_TRO
   */
  name: string;

  /**
   * The type of the course
   */
  courseType: 'CM' | 'TD' | 'TP';

  /**
   * Represent the exact moment the course takes places every week.
   */
  weekDate: {
    /**
     * Represent the day in the week.
     * 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
     */
    day: number;

    /**
     * The hour of the course.
     * It uses local Timezone as provided in the ical file
     */
    hour: number;

    /**
     * The minutes of the course.
     */
    minutes: number;
  };

  /**
   * The number of times this courses takes place.
   */
  count: number;

  /**
   * The date of the first course
   */
  startDate: Date;

  /**
   * The course duration in miliseconds
   */
  duration: number;
}
