import { FakeAsso, createAsso } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { e2eSuite } from '../../utils/test_utils';
import { ConfigModule } from '../../../src/config/config.module';

const SearchE2ESpec = e2eSuite('GET /assos', (app) => {
  const assos: FakeAsso[] = [];
  for (let i = 0; i < 29; i++) {
    assos.push(createAsso(app));
  }
  assos.push(
    createAsso(app, {
      login: 'bdeutt',
      name: 'BDE',
      mail: 'bde@utt.fr',
    }),
  );

  beforeAll(() => {
    assos.mappedSort((asso) => [asso.id]);
  })

  it('should return a 400 as page is negative', () => {
    return pactum
      .spec()
      .get('/assos?q=BDE&page=-1')
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return a list of all assos (within the first page)', () => {
    return pactum
      .spec()
      .get('/assos')
      .expectAssos(app, assos.slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE), assos.length);
  });

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .get('/assos')
      .withQueryParams('page', 2)
      .expectAssos(
        app,
        assos.slice(
          app().get(ConfigModule).PAGINATION_PAGE_SIZE,
          Math.min(30, app().get(ConfigModule).PAGINATION_PAGE_SIZE * 2),
        ),
        assos.length,
      );
  });
});

export default SearchE2ESpec;
