declare global {
  interface Array<T> {
    /**
     * Sorts the current array (in place) and returns it.
     * Array is sorted based on a mapper function, that returns in order the values by which to sort the array.
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
  return this.reduce((acc, curr) => (acc.includes(curr) ? acc : [...acc, curr]), [] as T[]);
};

export {};
