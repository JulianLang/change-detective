import { ChangeType } from './change.type';

export interface PropertyChange<T> {
  previous: T;
  current: T;
  type: ChangeType;
}
