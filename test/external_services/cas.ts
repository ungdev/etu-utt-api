import axios from 'axios';
import * as nock from 'nock';
import { HttpStatus } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { RegisterData } from '../../src/auth/auth.service';

export const validService = faker.internet.url();
export const validTicket = faker.datatype.uuid();
export const user: RegisterData = {
  login: faker.datatype.uuid(),
  mail: faker.internet.email(),
  lastName: faker.name.lastName(),
  firstName: faker.name.firstName(),
};

export function enable() {
  axios.defaults.adapter = 'http';
  nock(`https://cas.utt.fr/cas`)
    .persist()
    .get(`/serviceValidate`)
    .query({ service: validService, ticket: validTicket })
    .reply(
      HttpStatus.OK,
      "<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>\n" +
        '    <cas:authenticationSuccess>\n' +
        `        <cas:user>${user.login}</cas:user>\n` +
        '        <cas:attributes>\n' +
        `            <cas:uid>${user.login}</cas:uid>\n` +
        `            <cas:mail>${user.mail}</cas:mail>\n` +
        `            <cas:sn>${user.lastName}</cas:sn>\n` +
        `            <cas:givenName>${user.firstName}</cas:givenName>\n` +
        '        </cas:attributes>\n' +
        '    </cas:authenticationSuccess>\n' +
        '</cas:serviceResponse>',
    )
    .get('/serviceValidate')
    .query(true)
    .reply(
      HttpStatus.OK,
      "<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>" +
        "    <cas:authenticationFailure code='INVALID_TICKET'>\n" +
        '        le ticket &#039;ST-655671-6MeawvzH2JpiHmzwGova-cas.utt.fr&#039; est inconnu\n' +
        '    </cas:authenticationFailure>\n' +
        '</cas:serviceResponse>',
    );
}
