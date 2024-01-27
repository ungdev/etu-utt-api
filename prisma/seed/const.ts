import { faker } from '@faker-js/faker';

// While waiting to be able to recover the real data
export const branchesCode = ['ISI', 'GM', 'RT', 'MTE', 'GI', 'SN', 'A2I', 'MM'];
export const branchOptionsCode = ['IPL', 'ATN', 'VDC', 'MDPI', 'SNM', 'CeISME'];
export const baseUesCode = ['EG', 'IF', 'LO', 'LE', 'MT', 'HT', 'MA', 'RE', 'SY', 'MQ', 'GE', 'SC', 'LG', 'PS', 'CM'];
export const creditType = ['CS', 'TM', 'EC', 'HT', 'ME', 'ST', 'EE'];

//As we need Translation for UTTBranche and UTTFiliere, both need to know some Translation uuids
//For that, there is this list
export const translationsUuids: Array<string> = Array.from({ length: 100 }, () => faker.datatype.uuid());
