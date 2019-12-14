import { AllChangesType } from './internal/all-changes';
import { Func } from './internal/func';
import { PropertyChanges } from './internal/property.changes';
import { SubscribeCallback } from './subscribe-callback';

export const ChangeDetective = Symbol('change-detective');

/** An object which state is observed and that changes are tracked. */
export interface ChangeDetectable<T = any> {
  [ChangeDetective]: ChangeDetectableFarcade<T>;
}

export interface ChangeDetectableFarcade<T> {
  /**
   * Subscribes to all future changes with a handler callback function.
   * @param handler Function to be called whenever a value changed
   * @returns Function to unsubscribe from changes.
   */
  subscribe(handler: SubscribeCallback<T>, property?: keyof T | AllChangesType): Func<[], void>;
  hasChanges(): boolean;
  resetChanges(): void;
  changes(property?: keyof T): PropertyChanges | PropertyChanges[];
}
