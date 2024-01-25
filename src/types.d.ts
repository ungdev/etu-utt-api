/**
 * Represents pagination data.
 * @template T The type of the items of the paginated list.
 * @property items The items of the paginated list.
 * @property itemsPerPage The number of items per page.
 * @property itemCount The total number of items.
 */
declare interface Pagination<T> {
  items: T[];
  itemsPerPage: number;
  itemCount: number;
}

/** Used to recursively remove any readonly keyword on a object and all its properties */
declare type DeepWritable<T> = {
  -readonly [key in keyof T]: DeepWritable<T[key]>;
};

declare type UnpartialFields<T, K extends keyof T> = { [P in K]-?: T[P] } & {
  [P in keyof T]: P extends T ? never : T[P];
};
