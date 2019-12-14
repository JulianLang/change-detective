import { ChangeDetectorResult } from './change-detector.result';
import { ChangeType } from './change.type';

export interface ChangeDetector {
  <T, K>(
    value: T,
    previous: T,
    property: PropertyKey,
    target: K,
    type: ChangeType,
  ): ChangeDetectorResult;
}
