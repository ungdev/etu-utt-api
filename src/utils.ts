import { Language } from "@prisma/client";
import { Translation } from "./prisma/types";

/**
 * Sorts an array and returns it. The sort is done in place if the `inPlace` parameter is true.
 * Array is sorted based on a mapper function, that returns in order the values by which to sort the array.
 * @example
 * const array = [
 *   { a: 3, b: 'early into the alphabet' },
 *   { a: 1, b: 'hello world !' },
 *   { a: 1, b: 'hi' },
 * ];
 * sortArray(array, (e) => [e.a, e.b]);
 * // Result :
 * // [
 * //   { a: 1, b: 'hello world !' },
 * //   { a: 1, b: 'hi' },
 * //   { a: 3, b: 'early into the alphabet' },
 * // ]
 * @param array The array to sort
 * @param mapper A function that returns a list of values that will be used for comparison.
 *               The length of the array should be fixed, not dependent on the value to map.
 * @param inPlace Whether to sort the array in place or to create a new array.
 */
export function sortArray<T>(array: T[], mapper: (e: T) => any[] | any, inPlace = true): T[] {
  array = inPlace ? array : array.slice();
  return array.sort((a, b) => {
    const aMapped = mapper(a);
    const bMapped = mapper(b);
    const aValues = aMapped instanceof Array ? aMapped : [aMapped];
    const bValues = bMapped instanceof Array ? bMapped : [bMapped];
    for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
      // TODO : add a sentry error if this happens
      if (aValues[i] < bValues[i]) {
        return -1;
      }
      if (bValues[i] < aValues[i]) {
        return 1;
      }
    }
    return 0;
  });
}

/**
 * Returns a new object built from the given object with only the specified keys.
 * @param obj The object to transform.
 * @param keys The keys to pick.
 */
export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
/**
 * Filters an object keeping only the given keys. This overload can be used in a pipe,
 * for example with `Array.map` or `Promise.then`.
 * @param keys The keys to pick.
 */
export function pick<T extends object, K extends keyof T>(...keys: K[]): (obj: T) => Pick<T, K>;
export function pick<T extends object, K extends keyof T>(objOrKey: T | K, ...keys: K[]) {
  return typeof objOrKey === 'object'
    ? (Object.fromEntries(Object.entries(objOrKey).filter(([key]) => keys.includes(key as K))) as Pick<T, K>)
    : (value: T) => pick<T, K>(value, objOrKey as K, ...keys);
}

/**
 * Filters an object from the given keys. This function returns a new object and does not mutate the original one.
 * @param obj The object to transform.
 * @param keys The keys to omit.
 */
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
/**
 * Filters an object from the given keys. This overload can be used in a pipe,
 * for example with `Array.map` or `Promise.then`.
 * @param keys The keys to omit.
 */
export function omit<T extends object, K extends keyof T>(...keys: K[]): (obj: T) => Omit<T, K>;
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
export function omit<T extends object, K extends keyof T>(objOrKey: T | K, ...keys: K[]) {
  return typeof objOrKey === 'object'
    ? (Object.fromEntries(Object.entries(objOrKey).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>)
    : (value: T) => omit<T, K>(value, objOrKey as K, ...keys);
}

export function getTranslation(translation: Translation | null, language: Language) {
  return translation?.[language] ?? translation?.fr ?? null;
}

export const translationSelect = {
  select: {
    fr: true,
    en: true,
    de: true,
    es: true,
    zh: true,
  },
};
