import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { ParkingUpdateDto } from '../../../src/profile/dto/parking-update.dto';
import * as fakedb from '../../utils/fakedb';
import { PrismaService } from '../../../src/prisma/prisma.service';

const SetParkingE2ESpec = e2eSuite('PUT /profile/parking', (app) => {
  const user = fakedb.createUser(app);
  const widget = fakedb.createParkingWidget(app, { user });

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
  ] as ParkingUpdateDto[];

  it('should fail as user is not connected', () =>
    pactum.spec().put('/profile/parking').withBody(body).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail for each value of the body as they are negative', () => {
    pactum
      .spec()
      .put('/profile/parking')
      .withBody([{ ...body[0], x: -1 }])
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
    pactum
      .spec()
      .put('/profile/parking')
      .withBody([{ ...body[0], y: -1 }])
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
    pactum
      .spec()
      .put('/profile/parking')
      .withBody([{ ...body[0], width: 0 }])
      .expectAppError(ERROR_CODE.PARAM_TOO_LOW, 'width');
    pactum
      .spec()
      .put('/profile/parking')
      .withBody([{ ...body[0], height: 0 }])
      .expectAppError(ERROR_CODE.PARAM_TOO_LOW, 'height');
  });

  it('should fail as the widgets are overlapping', () => {
    pactum
      .spec()
      .put('/profile/parking')
      .withBearerToken(user.token)
      .withBody([body[0], { ...body[1], x: 0, y: 0 }])
      .expectAppError(ERROR_CODE.WIDGET_OVERLAPPING, '0', '1');
  });

  it('should successfully set the parking widgets', async () => {
    await pactum.spec().put('/profile/parking').withBearerToken(user.token).withBody(body).expectParkingWidgets(body);
    const prisma = app().get(PrismaService);
    const widgetsFromDb = await prisma.userParkingWidget.findMany();
    expect(widgetsFromDb).toHaveLength(2);
    prisma.userParkingWidget.deleteMany();
    await fakedb.createParkingWidget(app, { user }, widget, true);
  });
});

export default SetParkingE2ESpec;