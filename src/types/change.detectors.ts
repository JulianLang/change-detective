import { ChangeDetector } from './change.detector';

export interface ChangeDetectors {
  [key: string]: ChangeDetector;
}
