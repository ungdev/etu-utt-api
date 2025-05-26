import axios from 'axios';
import nock from 'nock';
import { HttpStatus } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { RegisterUserData } from '../../src/auth/auth.service';
import { ConfigModule } from '../../src/config/config.module';

export let validService = '';
export const validTicket = faker.string.uuid();
export const user: RegisterUserData = {
  login: faker.string.uuid(),
  mail: faker.internet.email(),
  lastName: faker.person.lastName(),
  firstName: faker.person.firstName(),
  tokenExpiresIn: 999999,
};

export function enable(config: ConfigModule) {
  validService = config.CAS_SERVICE;
  axios.defaults.adapter = 'http';
  nock(config.CAS_URL)
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
