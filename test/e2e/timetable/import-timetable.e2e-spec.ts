import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from 'src/exceptions';
import { setTimetable } from '../../external_services/timetable';
import { PrismaService } from '../../../src/prisma/prisma.service';

const ImportTimetableE2ESpec = e2eSuite('POST /timetable/import', (app) => {
  const user = fakedb.createUser(app);
  const user2 = fakedb.createUser(app);
  const user3 = fakedb.createUser(app);
  const user4 = fakedb.createUser(app);
  const semester = fakedb.createSemester(app);
  const ue = fakedb.createUe(app);
  const ue2 = fakedb.createUe(app);

  it('should fail as user is not authenticated', async () =>
    await pactum.spec().post('/timetable/import').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as service is invalid', async () => {
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
        service: 'invalid service',
      })
      .expectAppError(ERROR_CODE.PARAM_MALFORMED, 'service');
  });

  it('should fail as UE is invalid', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_UNKNOWN_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, 'UNKNOWN');
  });

  it('should fail as course type has incorrect value', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:INVALID 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      })
      .expectAppError(ERROR_CODE.PARAM_MALFORMED, 'courseType');
  });

  it('should create an ueCourse', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });

    const prisma = app().get(PrismaService);

    expect(
      (await prisma.ueCourse.count({
        where: {
          ue: {
            code: ue.code,
            id: ue.id,
          },
          semester: semester,
        },
      })) == 1,
    );
  });

  it('should not create another course if it already exist', async () => {
    // Twice the same event
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT
      BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });

    const prisma = app().get(PrismaService);

    expect(
      (await prisma.ueCourse.count({
        where: {
          ue: {
            code: ue.code,
            id: ue.id,
          },
          semester: semester,
        },
      })) == 1,
    );
  });

  it('should create multiple courses', async () => {
    // Two different events
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT
      BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue2.code}_FR_TRO - CM 
      DESCRIPTION:CM 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });

    const prisma = app().get(PrismaService);

    expect(
      (await prisma.ueCourse.count({
        where: {
          ue: {
            code: ue.code,
            id: ue.id,
          },
          semester: semester,
        },
      })) == 1,
    );

    expect(
      (await prisma.ueCourse.count({
        where: {
          ue: {
            code: ue2.code,
            id: ue2.id,
          },
          semester: semester,
        },
      })) == 1,
    );
  });

  it('should add the first user to course', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:TP 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });

    const prisma = app().get(PrismaService);

    expect(
      (await prisma.ueCourse.count({
        where: {
          students: {
            some: {
              id: user.id,
            },
          },
        },
      })) == 1,
    );
  });

  it('should add users to an existing course', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - CM 
      DESCRIPTION:TP 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:A001
      END:VEVENT`.replace(/^\s+/gm, ''),
    );

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user2.token)
      .withBody({
        uid: '0'.repeat(64),
      });
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user3.token)
      .withBody({
        uid: '0'.repeat(64),
      });
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user4.token)
      .withBody({
        uid: '0'.repeat(64),
      });

    const prisma = app().get(PrismaService);

    expect(
      (
        await prisma.ueCourse.findFirst({
          where: {
            ue: {
              code: ue.code,
              id: ue.id,
            },
            semester: semester,
          },
          include: {
            students: true,
          },
        })
      ).students.length == 4,
    );
  });

  it('Should return an error when the url is invalid', async () => {
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '9'.repeat(64),
      })
      .expectAppError(ERROR_CODE.RESSOURCE_UNAVAILABLE, `https://monedt.utt.fr/calendrier/${'9'.repeat(64)}.ics`);
  });

  it('Should return an error when the service send something of the wrong format', async () => {
    setTimetable('I am not respecting the .ics file format');
    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      })
      .expectAppError(ERROR_CODE.RESSOURCE_INVALID_TYPE, 'ical');
  });

  it('Should not create duplicates for the same course occurence', async () => {
    setTimetable(
      `BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - TD 
      DESCRIPTION:TD 
      DTSTART:20240906T100000
      DTEND:20240906T120000
      LOCATION:P42
      END:VEVENT
      BEGIN:VEVENT
      UID:a85c5f9f0a3b3f0364e6ee9d4290ecd8
      DTSTAMP:20240927T112949Z
      SUMMARY:${semester.code}_${ue.code}_FR_TRO - TD 
      DESCRIPTION:TD 
      DTSTART:20240829T100000
      DTEND:20240906T120000
      LOCATION:P42
      END:VEVENT`.replace(/^\s+/gm, ''),
    );
    const prisma = app().get(PrismaService);

    await pactum
      .spec()
      .post('/timetable/import')
      .withBearerToken(user.token)
      .withBody({
        uid: '0'.repeat(64),
      });
    expect(
      (
        await prisma.ueCourse.findMany({
          where: {
            ueId: ue.id,
            semester: {
              code: semester.code,
            },
            timetableEntry: {
              location: 'P42',
            },
          },
        })
      ).length == 1,
    );
  });
});

export default ImportTimetableE2ESpec;
