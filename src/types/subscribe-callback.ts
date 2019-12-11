/** Callback function to be called whenever a change occurs. */
export interface SubscribeCallback<T> {
  (currentValue: T, oldValue: T): void;
}
