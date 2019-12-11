export function unequalDetector<T>(value: T, previous: T): boolean {
  return Object.is(value, previous);
}
