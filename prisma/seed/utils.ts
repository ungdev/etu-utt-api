import { Faker, faker } from '@faker-js/faker';
import { Entity, FakeEntityMap } from '../../test/utils/fakedb';
import { Translation } from 'src/prisma/types';

// While waiting to be able to recover the real data
export const branchesCode = ['ISI', 'GM', 'RT', 'MTE', 'GI', 'SN', 'A2I', 'MM'];
export const branchOptionsCode = ['IPL', 'ATN', 'VDC', 'MDPI', 'SNM', 'CeISME'];
export const baseUesCode = ['EG', 'IF', 'LO', 'LE', 'MT', 'HT', 'MA', 'RE', 'SY', 'MQ', 'GE', 'SC', 'LG', 'PS', 'CM'];
export const creditType = ['CS', 'TM', 'EC', 'HT', 'ME', 'ST', 'EE'];

/**
 * Stores all values that should be unique and shall not be used multiple times by faker
 * The values of this object are reset using {@link clearUniqueValues} in beforeAll blocks.
 */
const registeredUniqueValues: {
  [Type in keyof FakeEntityMap]?: {
    [property in keyof Entity<Type> & string]?: Entity<Type>[property][];
  };
} = {};

/**
 * Checks whether using a value preserved uniqueness of this value.
 * @param entityType the scope of the unique value. For example, if you want to generate a unique value for a UE, you should pass 'ue' as the first parameter.
 * @param property the name of the property that should be unique.
 * @param value the value that should be unique.
 * @returns whether the value can be used or not.
 */
const canUseValue = <T extends keyof FakeEntityMap, K extends keyof Entity<T> & string>(
  entityType: T,
  property: K,
  value: Entity<T>[K],
) => {
  if (!(entityType in registeredUniqueValues)) return true;
  if (!(property in registeredUniqueValues[entityType])) return true;
  return !registeredUniqueValues[entityType][property].includes(value);
};

/**
 * Registers a value as used, so that it is not used again by faker.
 * @param entityType the scope of the unique value. For example, if you generated a unique value for a UE, you should pass 'ue' as the first parameter.
 * @param property the name of the unique property.
 * @param value the value of the unique property.
 */
export const registerUniqueValue = <T extends keyof FakeEntityMap, K extends keyof Entity<T> & string>(
  entityType: T,
  property: K,
  value: Entity<T>[K],
): Entity<T>[K] => {
  if (!(entityType in registeredUniqueValues))
    registeredUniqueValues[entityType] = {
      [property]: [value],
    };
  else if (!(property in registeredUniqueValues[entityType]))
    registeredUniqueValues[entityType][property] = [value] as any;
  else registeredUniqueValues[entityType][property].push(value);
  return value;
};

/**
 * Clears all unique values that have been registered and makes all values available again.
 * This function is called automatically in beforeAll blocks when database is cleared.
 */
export const clearUniqueValues = () => {
  for (const key in registeredUniqueValues) delete registeredUniqueValues[key];
};

/**
 * Function that can generate a safe random unique value.
 * It is "safe" in the sense that it will not generate a value that has already been generated since last call to {@link clearUniqueValues}.
 * @param table the for which the value is generated.
 * @param column the column for which the value is generated.
 * @param generatorFunction the function that generates the value.
 * @param maxCount the number of possible values that can be generated. If all values have already been generated, an error will be thrown.
 */
function fakeSafeUniqueData<T extends keyof FakeEntityMap, K extends keyof Entity<T> & string>(
  table: T,
  column: K,
  generatorFunction: () => FakeEntityMap[T]['entity'][K],
  maxCount = Number.POSITIVE_INFINITY,
) {
  if ((registeredUniqueValues[table]?.[column]?.length ?? 0) >= maxCount)
    throw new Error(
      `FakerError: All values for ${table}.${column} are used. Clear the unique values with \`clearUniqueValues()\` before`,
    );
  let data: Entity<T>[K];
  do {
    data = generatorFunction();
  } while (!canUseValue(table, column, data));
  return registerUniqueValue(table, column, data);
}

/**
 * Extends the faker module with custom functions.
 * These functions are used to generate values for the database.
 * This is the schema of the extension:
 * {@code {db: { [tableName]: { [columnName]: () => value } } } }
 */
declare module '@faker-js/faker' {
  export interface Faker {
    db: {
      branchOption: {
        code: () => string;
      };
      branch: {
        code: () => string;
      };
      semester: {
        code: () => string;
      };
      ue: {
        code: () => string;
      };
      ueCreditCategory: {
        code: () => string;
      };
      ueStarVote: {
        value: () => number;
      };
      translation: (rng?: () => string) => Omit<Translation, 'id'>;
      assoMembershipRole: {
        position: () => number;
      };
    };
  }
}

Faker.prototype.db = {
  branchOption: {
    code: () =>
      fakeSafeUniqueData(
        'branchOption',
        'code',
        () => faker.helpers.arrayElement(branchOptionsCode),
        branchOptionsCode.length,
      ),
  },
  branch: {
    code: () =>
      fakeSafeUniqueData('branch', 'code', () => faker.helpers.arrayElement(branchesCode), branchesCode.length),
  },
  semester: {
    code: () =>
      fakeSafeUniqueData(
        'semester',
        'code',
        () => `${faker.helpers.arrayElement(['P', 'A'])}${faker.number.int({ min: 10, max: 24 })}`,
        30,
      ),
  },
  ue: {
    code: () =>
      fakeSafeUniqueData(
        'ue',
        'code',
        () => faker.helpers.arrayElement(baseUesCode) + `${faker.number.int({ min: 1, max: 13 })}`.padStart(2, '0'),
      ),
  },
  ueCreditCategory: {
    code: () =>
      fakeSafeUniqueData('ueCreditCategory', 'code', () => faker.helpers.arrayElement(creditType), creditType.length),
  },
  ueStarVote: {
    value: () => faker.number.int({ min: 1, max: 5 }),
  },
  translation: (rng = faker.word.words) => ({
    fr: rng(),
    en: rng(),
    de: rng(),
    zh: rng(),
    es: rng(),
  }),
  assoMembershipRole: {
    position: () =>
      fakeSafeUniqueData(
        'assoMembershipRole',
        'position',
        () => Math.max(...(registeredUniqueValues.assoMembershipRole?.position ?? [0])) + 1,
      ),
  },
};

export function generateTranslation(rng: () => string = faker.word.words) {
  return {
    create: {
      fr: rng(),
      en: rng(),
      de: rng(),
    },
  };
}

export { Faker };
