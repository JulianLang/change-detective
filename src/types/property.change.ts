import { ChangeType } from './change.type';

export interface PropertyChange<T> {
  oldValue: T;
  currentValue: T;
  type: ChangeType;
}
