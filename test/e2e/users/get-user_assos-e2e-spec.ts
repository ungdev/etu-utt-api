import { e2eSuite } from '#/utils/test_utils';
import { createAsso, createAssoMembership, createAssoMembershipRole, createUser } from '#/utils/fakedb';
import * as pactum from 'pactum';
import { PrismaService } from '@/prisma/prisma.service';
import { omit } from '@/utils';
import { ERROR_CODE } from '@/exceptions';

const GetUserAssociationE2ESpec = e2eSuite('GET /users/:userId/associations', (app) => {
  const user = createUser(app);
  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso: asso, user: user, role });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/users/${user.id}/associations`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 as user was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdefg/associations')
      .withBearerToken(user.token)
      .expectAppError(ERROR_CODE.NO_SUCH_USER, 'abcdefg');
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
                name: true,
              },
            },
            asso: {
              select: {
                name: true,
                logo: true,
                descriptionShortTranslation: {
                  select: {
                    fr: true,
                  },
                },
                mail: true,
              },
            },
          },
        })
    ).map((membership) => ({
      ...omit(membership, 'role', 'endAt', 'startAt', 'asso'),
      role: membership.role.name,
      endAt: membership.endAt,
      startAt: membership.startAt,
      asso: {
        ...omit(membership.asso, 'descriptionShortTranslation'),
        shortDescription: membership.asso.descriptionShortTranslation.fr,
        logo: membership.asso.logo ? `/media/image/${membership.asso.logo.id}.webp` : null,
      },
    }));

    return pactum
      .spec()
      .get(`/users/${user.id}/associations`)
      .withBearerToken(user.token)
      .$expectRegexableJson(assoMembershipFromDb.filter((value) => value !== undefined));
  });
});

export default GetUserAssociationE2ESpec;
