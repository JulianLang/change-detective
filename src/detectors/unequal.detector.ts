import { ChangeDetectorResult } from '../types/change-detector.result';

export function unequalDetector<T>(value: T, previous: T): ChangeDetectorResult {
  const isSame = Object.is(value, previous);

  return !isSame;
}
