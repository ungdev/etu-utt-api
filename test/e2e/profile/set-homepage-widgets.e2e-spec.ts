import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { HomepageWidgetsUpdateElement } from '../../../src/profile/dto/homepage-widgets-update.dto';
import * as fakedb from '../../utils/fakedb';
import { PrismaService } from '../../../src/prisma/prisma.service';

const SetHomepageWidgetsE2ESpec = e2eSuite('PUT /profile/homepage', (app) => {
  const user = fakedb.createUser(app);
  const widget = fakedb.createHomepageWidget(app, { user });

  const body = [
    {
      widget: 'a_widget',
      x: 0,
      y: 0,
      height: 1,
      width: 1,
    },
    {
      widget: 'another_widget',
      x: 3,
      y: 6,
      height: 3,
      width: 2,
    },
  ] as HomepageWidgetsUpdateElement[];

  it('should fail as user is not connected', () =>
    pactum.spec().put('/profile/homepage').withJson(body).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail for each value of the body as they are not allowed (too small, wrong type, ...)', async () => {
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], x: 1.5 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_INT, 'x');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], y: 1.5 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_INT, 'y');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], width: 1.5 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_INT, 'width');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], height: 1.5 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_INT, 'height');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], x: -1 }])
      .expectAppError(ERROR_CODE.PARAM_TOO_LOW, 'x');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], y: -1 }])
      .expectAppError(ERROR_CODE.PARAM_TOO_LOW, 'y');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], width: 0 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'width');
    await pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([{ ...body[0], height: 0 }])
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'height');
  });

  it('should fail as the widgets are overlapping', () => {
    pactum
      .spec()
      .put('/profile/homepage')
      .withBearerToken(user.token)
      .withJson([body[0], { ...body[1], x: 0, y: 0 }])
      .expectAppError(ERROR_CODE.WIDGET_OVERLAPPING, '0', '1');
  });

  it('should successfully set the homepage widgets', async () => {
    await pactum.spec().put('/profile/homepage').withBearerToken(user.token).withJson(body).expectHomepageWidgets(body);
    const prisma = app().get(PrismaService);
    const widgetsFromDb = await prisma.userHomepageWidget.findMany();
    expect(widgetsFromDb).toHaveLength(2);
    prisma.userHomepageWidget.deleteMany();
    await fakedb.createHomepageWidget(app, { user }, widget, true);
  });
});

export default SetHomepageWidgetsE2ESpec;
