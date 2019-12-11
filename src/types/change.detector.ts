import { Nullable } from './nullable';
import { PropertyChange } from './property.change';

export interface ChangeDetector {
  <T, K>(value: T, previous: T, property: PropertyKey, target: K): Nullable<PropertyChange<T>>;
}
