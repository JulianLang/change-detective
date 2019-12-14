export interface ChangeDetector {
  <T, K>(value: T, previous: T, property: PropertyKey, target: K): boolean;
}
