/** Callback function to be called whenever a change occurs. */
export interface SubscribeCallback<T> {
  (property: PropertyKey, current: T[keyof T], previous: T[keyof T]): void;
}
