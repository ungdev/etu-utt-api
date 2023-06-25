import * as pactum from 'pactum';
import { AuthSignInDto, AuthSignUpDto } from '../../src/auth/dto';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

export function AuthE2ESpec(app: () => INestApplication) {
  describe('Auth', () => {
    describe('Signup', () => {
      const dto = {
        login: 'testLogin',
        password: 'testPassword',
        firstName: 'testFirstName',
        lastName: 'testLastName',
        studentId: 44250,
        sex: 'OTHER',
        birthday: new Date('1999-01-01'),
      } as AuthSignUpDto;
      it('should return a 400 if login is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, login: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if login is not alphanumeric', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, login: 'my/login_1' })
          .expectStatus(400);
      });
      it('should return a 400 if password is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, password: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if lastName is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, lastName: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if firstName is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, firstName: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if studentId is not a number', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, studentId: 'this is a string' })
          .expectStatus(400);
      });
      it('should return a 400 if studentId is not positive', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, studentId: -1 })
          .expectStatus(400);
      });
      it('should return a 400 if sex is not provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, sex: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if sex is not one of MALE, FEMALE or OTHER is not provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, sex: 'neither of these' })
          .expectStatus(400);
      });
      it('should return a 400 if birthday is not provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, birthday: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if birthday is not a date', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            birthday: 'My birthday is on the 32nd of February',
          })
          .expectStatus(400);
      });
      it('should return a 400 if no body is provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(undefined)
          .expectStatus(400);
      });
      it('should create a new user', async () => {
        await pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
        const user = await app()
          .get(PrismaService)
          .user.findUnique({
            where: { login: dto.login },
            include: { infos: true },
          });
        expect(user).toBeDefined();
        expect(user.login).toEqual(dto.login);
        expect(user.firstName).toEqual(dto.firstName);
        expect(user.lastName).toEqual(dto.lastName);
        expect(user.studentId).toEqual(dto.studentId);
        expect(user.infos.sex).toEqual(dto.sex);
        expect(user.infos.birthday).toEqual(dto.birthday);
        expect(user.id).toMatch(/[a-z0-9-]{36}/);
      });
    });

    describe('Signin', () => {
      const dto: AuthSignInDto = {
        login: 'testLogin',
        password: 'testPassword',
      };
      it('should return a 400 if login is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ ...dto, login: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if login is not alphanumeric', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ ...dto, login: 'my/login_1' })
          .expectStatus(400);
      });
      it('should return a 400 if password is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ ...dto, password: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if no body is provided', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(undefined)
          .expectStatus(400);
      });
      it('should return a token for a valid user', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('access_token')
          .stores('userAccessToken', 'access_token');
      });
    });
  });
}
