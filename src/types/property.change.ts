import { Member } from './internal/member';

export interface PropertyChange<T = any> {
  property: PropertyKey;
  previous: Member<T>;
  current: Member<T>;
}
