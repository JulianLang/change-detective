import { ChangeMarker, ChangeType, Nullable } from '../types';

export function initialPropertyAddedInterceptor(
  current: any,
  previous: any,
  property: PropertyKey,
  target: any,
  type: ChangeType,
): Nullable<ChangeMarker> {
  if (target[property] !== undefined && previous === undefined && type === 'added') {
    return 'no-change';
  }

  return null;
}
