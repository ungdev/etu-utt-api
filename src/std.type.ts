declare global {
  interface Array<T> {
    /**
     * Groups the current array by a key, using a mapper function.
     */
    groupyBy<K extends string | number | symbol>(keyMapper: (entity: T) => K): { [key in K]: T[] };
    /**
     * Sorts the current array (in place) and returns it.
     * Array is sorted based on a mapper function, that returns in order the values by which to sort the array.
     * Sorting based on a string IS NOT case-sensitive, meaning 'A' and 'a' have the same value.
     * @example
     * const array = [
     *   { a: 3, b: 'early into the alphabet' },
     *   { a: 1, b: 'hello world !' },
     *   { a: 1, b: 'hi' },
     * ];
     * array.mappedSort((e) => [e.a, e.b]);
     * // Result :
     * // [
     * //   { a: 1, b: 'hello world !' },
     * //   { a: 1, b: 'hi' },
     * //   { a: 3, b: 'early into the alphabet' },
     * // ]
     * @param mapper A function that returns a list of values that will be used for comparison.
     *               The length of the array should be fixed, not dependent on the value to map.
     */
    mappedSort(mapper: (e: T) => any[] | any): this;

    /**
     * Creates a new array containing the same values as the original array, but removing duplicates.
     * The order is not changed. A duplicate gets the position where it was found first.
     * The original array is not modified.
     * @example
     * const array = [1, 2, 3, 3, 2, 5, 2, 6];
     * array.unique();
     * // Result :
     * // [1, 2, 3, 5, 6]
     */
    unique(): Array<T>;
  }

  interface ObjectConstructor {
    keys<O extends object>(o: O): (keyof O)[];
  }
}

Array.prototype.groupyBy = function <T, K extends string | number | symbol>(
  this: Array<T>,
  keyMapper: (entity: T) => K,
) {
  return this.reduce((acc, entity) => {
    const key = keyMapper(entity);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entity);
    return acc;
  }, {} as { [key in K]: T[] });
};

Array.prototype.mappedSort = function <T>(this: Array<T>, mapper: (e: T) => any[] | any) {
  return this.sort((a, b) => {
    const aMapped = mapper(a);
    const bMapped = mapper(b);
    const aValues = aMapped instanceof Array ? aMapped : [aMapped];
    const bValues = bMapped instanceof Array ? bMapped : [bMapped];
    for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
      const aValue = typeof aValues[i] === 'string' ? aValues[i].toUpperCase() : aValues[i];
      const bValue = typeof bValues[i] === 'string' ? bValues[i].toUpperCase() : bValues[i];
      if (aValue < bValue) {
        return -1;
      }
      if (bValue < aValue) {
        return 1;
      }
    }
    return 0;
  });
};

Array.prototype.unique = function <T>(this: Array<T>) {
  return this.filter((value, index) => this.indexOf(value) === index);
};

export {};
