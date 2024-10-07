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
  nock(timetableUrl).persist().get(/.*/).reply(HttpStatus.OK, ()=>timetableData);
}
