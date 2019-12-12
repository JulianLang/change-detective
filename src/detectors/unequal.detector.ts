export function unequalDetector<T>(value: T, previous: T): boolean {
  const isSame = Object.is(value, previous);

  return !isSame;
}
