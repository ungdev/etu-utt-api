import { describe, beforeAll, afterAll } from 'vitest';
import '#/declarations.js';
import '@/std.type.js';
import * as testUtils from '#/utils/test_utils.js';
import * as pactum from 'pactum';
import AuthE2ESpec from '#/e2e/auth/index.js';
import ProfileE2ESpec from '#/e2e/profile/index.js';
import UsersE2ESpec from '#/e2e/users/index.js';
import TimetableE2ESpec from '#/e2e/timetable/index.js';
import UeE2ESpec from '#/e2e/ue/index.js';
import * as cas from '#/external_services/cas.js';
import * as timetableProvider from '#/external_services/timetable.js';
import { ConfigService } from '@/config/config.service.js';
import AssoE2ESpec from '#/e2e/assos/index.js';
import MediaE2ESpec from '#/e2e/media/index.js';
import BranchE2ESpec from '#/e2e/branch/index.js';
import { buildTestApp, E2EApp } from '#/utils/test_utils.js';

describe('EtuUTT API e2e testing', () => {
  let app: E2EApp;

  beforeAll(async () => {
    app = await buildTestApp(3001);
    testUtils.init(() => app);
    cas.enable(app.get(ConfigService));
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
  MediaE2ESpec(() => app);
  BranchE2ESpec(() => app);
});
