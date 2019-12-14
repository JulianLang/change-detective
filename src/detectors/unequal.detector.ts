import { ChangeContext } from '../types';

export function unequalDetector<T>(value: T, previous: T, ctx: ChangeContext): boolean {
  const comparer = ctx.options.strictComparison ? strictComparison : looseComparison;
  const isSame = comparer();

  return !isSame;

  function strictComparison(): boolean {
    return Object.is(value, previous);
  }

  function looseComparison(): boolean {
    return true;
  }
}
