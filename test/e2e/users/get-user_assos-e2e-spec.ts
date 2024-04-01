import { e2eSuite } from '../../utils/test_utils';
import { createAsso, createAssoMembership, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { omit } from '../../../src/utils';

const GetUserAssociationE2ESpec = e2eSuite('GET /users/:userId/associations', (app) => {
  const user = createUser(app);
  const asso = createAsso(app);
  createAssoMembership(app, { asso: asso, user: user });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/users/${user.id}/associations`).expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as asso was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdefg/associations')
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the asso', async () => {
    const assoMembershipFromDb = (
      await app()
        .get(PrismaService)
        .assoMembership.findMany({
          where: { userId: user.id },
          select: {
            startAt: true,
            endAt: true,
            role: {
              select: {
                role: true,
              },
            },
            asso: {
              select: {
                name: true,
                logo: true,
                descriptionShortTranslationId: true,
                mail: true,
              },
            },
          },
        })
    ).map((membership) => ({
      ...omit(membership, 'role', 'endAt', 'startAt'),
      role: membership.role.role,
      endAt: membership.endAt.toISOString(),
      startAt: membership.startAt.toISOString(),
    }));

    return pactum
      .spec()
      .get(`/users/${user.id}/associations`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJson(assoMembershipFromDb.filter((value) => value !== undefined));
  });
});

export default GetUserAssociationE2ESpec;
