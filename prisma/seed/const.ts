import { faker } from '@faker-js/faker';

// While waiting to be able to recover the real data
export const branchesCode = ['ISI', 'GM', 'RT', 'MTE'];
export const filieresCode = ['IPL', 'ATN', 'VDC', 'MDPI', 'SNM', 'CeISME'];
export const baseUesCode = ['EG', 'IF', 'LO', 'LE', 'MT', 'HT', 'MA'];

//As we need Translation for UTTBranche and UTTFiliere, both need to know some Translation uuids
//For that, there is this list
export const translationsUuids: Array<string> = Array.from(
  { length: 100 },
  () => faker.datatype.uuid(),
);
