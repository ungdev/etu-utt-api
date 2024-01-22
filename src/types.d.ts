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
