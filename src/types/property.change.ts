import { ChangeType } from './change.type';

export interface PropertyChange<T = any> {
  property: PropertyKey;
  previous: T;
  current: T;
  type: ChangeType;
}
