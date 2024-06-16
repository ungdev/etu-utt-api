declare global {
  interface Array<T> {
    /**
     * Sorts the current array and returns it.
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
  }
}

Array.prototype.mappedSort = function <T>(this: Array<T>, mapper: (e: T) => any[] | any) {
  return this.sort((a, b) => {
    const aMapped = mapper(a);
    const bMapped = mapper(b);
    const aValues = aMapped instanceof Array ? aMapped : [aMapped];
    const bValues = bMapped instanceof Array ? bMapped : [bMapped];
    for (let i = 0; i < Math.min(aValues.length, bValues.length); i++) {
      if (aValues[i] < bValues[i]) {
        return -1;
      }
      if (bValues[i] < aValues[i]) {
        return 1;
      }
    }
    return 0;
  });
};

export {};
