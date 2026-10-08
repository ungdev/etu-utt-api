import { describe, beforeAll, afterAll } from 'vitest';
import '#/declarations.js';
import '@/std.type.js';
import * as testUtils from '#/utils/test_utils.js';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module.js';
import * as pactum from 'pactum';
import AuthE2ESpec from '#/e2e/auth/index.js';
import ProfileE2ESpec from '#/e2e/profile/index.js';
import UsersE2ESpec from '#/e2e/users/index.js';
import TimetableE2ESpec from '#/e2e/timetable/index.js';
import UeE2ESpec from '#/e2e/ue/index.js';
import { AppValidationPipe } from '@/app.pipe.js';
import * as cas from '#/external_services/cas.js';
import * as timetableProvider from '#/external_services/timetable.js';
import { ConfigService } from '@/config/config.service.js';
import AssoE2ESpec from '#/e2e/assos/index.js';
import MediaE2ESpec from '#/e2e/media/index.js';
import BranchE2ESpec from '#/e2e/branch/index.js';

describe('EtuUTT API e2e testing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(process.env.API_PREFIX);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(new AppValidationPipe());
    await app.init();
    await app.listen(3001);

    testUtils.init(() => app);
    pactum.request.setBaseUrl(
      `http://localhost:3001${process.env.API_PREFIX.startsWith('/') ? '' : '/'}${process.env.API_PREFIX}${
        process.env.API_PREFIX.endsWith('/') ? '' : '/'
      }v1`,
    );
    cas.enable(app.get(ConfigService));
    timetableProvider.enable('https://monedt.utt.fr/calendrier');
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
