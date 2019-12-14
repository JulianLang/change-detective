/** Type to describes a functions' signature. */
export type Func<A extends any[], R> = (...args: A) => R;
