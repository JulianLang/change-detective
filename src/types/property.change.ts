import { ChangeType } from './change.type';

export interface PropertyChange<T = any> {
  previous: T;
  current: T;
  type: ChangeType;
}
