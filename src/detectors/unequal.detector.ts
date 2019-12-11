import { Nullable, PropertyChange } from '../types';

export function unequalDetector<T>(value: T, previous: T): Nullable<PropertyChange<T>> {
  return previous !== value
    ? {
        current: value,
        previous,
        type: 'changed',
      }
    : null;
}
