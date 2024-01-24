import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { getValidationPipe } from '../src/validation';
import { PrismaService } from '../src/prisma/prisma.service';
import AuthE2ESpec from './e2e/auth/';
import ProfileE2ESpec from './e2e/profile';
import UsersE2ESpec from './e2e/users';
import UEE2ESpec from './e2e/ue';
import './declarations';

describe('EtuUTT API e2e testing', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();

    app.useGlobalPipes(getValidationPipe());
    await app.init();
    await app.listen(3001);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3001');
  });

  afterAll(() => {
    app.close();
  });

  AuthE2ESpec(() => app);
  ProfileE2ESpec(() => app);
  UsersE2ESpec(() => app);
  UEE2ESpec(() => app);
});
