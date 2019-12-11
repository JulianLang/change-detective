import { Func } from './func';
import { Member } from './member';
import { Nullable } from './nullable';
import { PropertyChanges } from './property.changes';
import { SubscribeCallback } from './subscribe-callback';

export const ChangeDetective = Symbol('change-detective');

/** An object which state is observed and that changes are tracked. */
export interface ChangeDetectable<T = any> {
  [ChangeDetective]: ChangeDetectableContent<T>;
}

export interface ChangeDetectableContent<T> {
  /**
   * Subscribes to all future changes with a handler callback function.
   * @param handler Function to be called whenever a value changed
   * @returns Function to unsubscribe from changes.
   */
  subscribe(handler: SubscribeCallback<T>, property?: Nullable<keyof T>): Func<[], void>;
  changes: Map<keyof T, PropertyChanges<Member<T>>>;
  hasChanges(): boolean;
}
