import '../declarations';
import '../../src/std.type';
import * as testUtils from '../utils/test_utils';
import * as pactum from 'pactum';
import AuthE2ESpec from './auth';
import ProfileE2ESpec from './profile';
import UsersE2ESpec from './users';
import TimetableE2ESpec from './timetable';
import UeE2ESpec from './ue';
import * as cas from '../external_services/cas';
import * as timetableProvider from '../external_services/timetable';
import { ConfigModule } from '../../src/config/config.module';
import AssoE2ESpec from './assos';
import { buildTestApp, E2EApp } from '../utils/test_utils';

describe('EtuUTT API e2e testing', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await buildTestApp(3001);
    testUtils.init(() => app);
    cas.enable(app.get(ConfigModule));
    timetableProvider.enable('https://monedt.utt.fr/calendrier');
    // While the migration from pactum.spec() to app().spec() has not been made on all tests, keep default base url.
    pactum.request.setBaseUrl(app.spec().baseUrl);
  });

  afterAll(async () => {
    await app.close();
  });

  AuthE2ESpec(() => app);
  ProfileE2ESpec(() => app);
  UsersE2ESpec(() => app);
  TimetableE2ESpec(() => app); // Deactivated, see function
  UeE2ESpec(() => app);
  AssoE2ESpec(() => app);
});
