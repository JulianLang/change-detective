import { DetectOptions } from './detect.options';

export interface ChangeContext<T = any> {
  property: PropertyKey;
  target: T;
  options: DetectOptions;
}
