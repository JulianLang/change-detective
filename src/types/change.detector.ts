import { ChangeContext } from './change.context';

export interface ChangeDetector {
  <T, K>(value: T, previous: T, context: ChangeContext<K>): boolean;
}
