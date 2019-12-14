import { ChangeContext } from '../types';

export function unequalDetector<T>(value: T, previous: T, ctx: ChangeContext): boolean {
  const compare = ctx.options.strictComparison ? strictComparison : looseComparison;
  const isSame = compare(value, previous, !!ctx.options.deepDetection);

  return !isSame;

  function strictComparison(value: any, previous: any): boolean {
    return Object.is(value, previous);
  }

  // borrowed from: https://github.com/dysfunc/observify/blob/master/src/index.js :)
  function looseComparison(value: any, previous: any, recursively: boolean): boolean {
    if (value === null || value === undefined || previous === null || previous === undefined) {
      return value === previous;
    }

    if (value.constructor !== previous.constructor) {
      return false;
    }

    // functions and regexp should strictly equal each other
    if (value instanceof Function || value instanceof RegExp) {
      return value === previous;
    }

    // strict equality check or matching valueOf
    if (value === previous || value.valueOf() === previous.valueOf()) {
      return true;
    }

    if (Array.isArray(value) && value.length !== previous.length) {
      return false;
    }

    // if dates, valueOf would've have matched
    if (value instanceof Date) {
      return false;
    }

    if (!(value instanceof Object) || !(previous instanceof Object)) {
      return false;
    }

    if (recursively) {
      // recursive object equality check
      const keys = Object.keys(value);

      return (
        Object.keys(previous).every(key => keys.indexOf(key) !== -1) &&
        keys.every(key => looseComparison(value[key], previous[key], true))
      );
    }

    return true;
  }
}
