import { PropertyChange } from './property.change';

/** Callback function to be called whenever a change occurs. */
export interface SubscribeCallback<T = any> {
  (change: PropertyChange<T>): void;
}
