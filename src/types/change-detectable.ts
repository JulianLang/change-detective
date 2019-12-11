import { Func } from './func';
import { PropertyChange } from './property.change';
import { SubscribeCallback } from './subscribe-callback';

/** An object which state is observed and that changes are tracked. */
export interface ChangeDetectable<T = any> {
  /**
   * Subscribes to all future changes with a handler callback function.
   * @param handler Function to be called whenever a value changed
   * @returns Function to unsubscribe from changes.
   */
  _subscribe(handler: SubscribeCallback<T>): Func<[], void>;
  _changes: Map<keyof T, PropertyChange<T>>;
  _hasChanges(): boolean;
}
