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
    entries<O extends object>(o: O): Array<[keyof O, O[keyof O]]>;
  }

  interface Date {
    /**
     * Removes the UTC time part of the date.
     * @returns Date A new date without the UTC time.
     */
    dropTime(): Date;

    /**
     * Adds the number of UTC years, months, days, etc. to the Date.
     * @param years Number of UTC years to add.
     * @param months Number of UTC months to add.
     * @param days Number of UTC days to add.
     * @param hours Number of UTC hours to add.
     * @param minutes Number of UTC minutes to add.
     * @param seconds Number of UTC seconds to add.
     * @param milliseconds Number of UTC milliseconds to add.
     * @returns A new Date offset by the specified number of UTC years, months, days, etc.
     */
    add({ years, months, days, hours, minutes, seconds, milliseconds }: { years?: number, months?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number }): Date;

    getWeekDate(): Date;
  }

  interface DateConstructor {
    getTimezoneOffset(timezone: string): number;
  }
}

Array.prototype.groupyBy = function <T, K extends string | number | symbol>(
  this: Array<T>,
  keyMapper: (entity: T) => K,
) {
  return this.reduce(
    (acc, entity) => {
      const key = keyMapper(entity);
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    },
    {} as { [key in K]: T[] },
  );
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

Date.prototype.dropTime = function (this: Date) {
  return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate()));
};

Date.prototype.add = function (this: Date, { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = {}) {
  return new Date(Date.UTC(this.getUTCFullYear() + years, this.getUTCMonth() + months, this.getUTCDate() + days, this.getUTCHours() + hours, this.getUTCMinutes() + minutes, this.getUTCSeconds() + seconds, this.getUTCMilliseconds() + milliseconds));
}

Date.prototype.getWeekDate = function (this: Date) {
  return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate() - this.getUTCDay()));
}

Date.getTimezoneOffset = function (timeZone: string) {
  // https://stackoverflow.com/questions/21327371/get-timezone-offset-from-timezone-name-using-javascript#answer-68593283
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 1000;
}

export {};
