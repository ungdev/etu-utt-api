/**
 * Sorts an array in place and returns it.
 * Array is sorted based a mapper function, that returns in order the values by which to sort the array.
 * Use example :
 * <pre>
 *   const array = [
 *     { a: 3, b: 'early into the alphabet' },
 *     { a: 1, b: 'hello world !' },
 *     { a: 1, b: 'hi' },
 *   ];
 *   sortArray(array, (e) => [e.a, e.b]);
 *   // Result :
 *   // [
 *   //   { a: 1, b: 'hello world !' },
 *   //   { a: 1, b: 'hi' },
 *   //   { a: 3, b: 'early into the alphabet' },
 *   // ]
 * </pre>
 * @param array The array to sort
 * @param mapper A function that returns a list of values that will be used for comparison. The length of the array should be fixed in advance.
 */
export function sortArray<T>(array: T[], mapper: (e: T) => any[] | any): T[] {
  return array.sort((a, b) => {
    const aMapped = mapper(a);
    const bMapped = mapper(b);
    const aValues = aMapped instanceof Array ? aMapped : [aMapped];
    const bValues = bMapped instanceof Array ? bMapped : [bMapped];
    for (let i = 0; i < aValues.length; i++) {
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
