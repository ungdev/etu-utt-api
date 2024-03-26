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

declare type UnpartialFields<T, K extends keyof T> = { [P in K]-?: T[P] } & {
  [P in keyof T]: P extends T ? never : T[P];
};

declare type SetPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
declare type RecursivelySetPartial<T, K> = K extends `${infer K1}.${infer K2}`
  ? Omit<T, K1> & RecursivelySetPartial<T, K2>
  : SetPartial<T, K>;
