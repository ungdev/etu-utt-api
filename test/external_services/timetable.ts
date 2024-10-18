import axios from 'axios';
import nock from 'nock';
import { HttpStatus } from '@nestjs/common';

let timetableData = '';

/**
 * Set the return data of any call to the timetable service http faker
 * @param data the data which will be sent
 */
export const setTimetable = (data: string) => {
  timetableData = data;
};

export function enable(timetableUrl: string) {
  axios.defaults.adapter = 'http';
  // Match everything except the calendar with id 9999[...]999.ics
  // which would be considered an invalid url
  nock(timetableUrl)
    .persist()
    .get(/^(?!.*\/calendrier\/9{64}\.ics).*/)
    .reply(HttpStatus.OK, () => timetableData);
}
