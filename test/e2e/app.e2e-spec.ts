import '../declarations';
import '../../src/array';
import * as testUtils from '../utils/test_utils';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as pactum from 'pactum';
import AuthE2ESpec from './auth';
import ProfileE2ESpec from './profile';
import UsersE2ESpec from './users';
import TimetableE2ESpec from './timetable';
import UEE2ESpec from './ue';
import { AppValidationPipe } from '../../src/app.pipe';
import * as cas from '../external_services/cas';
import { ConfigModule } from '../../src/config/config.module';
import AssoE2ESpec from './assos';

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
    cas.enable(app.get(ConfigModule).CAS_URL);
  });

  afterAll(() => {
    app.close();
  });

  AuthE2ESpec(() => app);
  ProfileE2ESpec(() => app);
  UsersE2ESpec(() => app);
  TimetableE2ESpec(() => app);
  UEE2ESpec(() => app);
  AssoE2ESpec(() => app);
});
