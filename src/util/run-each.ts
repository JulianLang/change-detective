import { Func } from '../types';
import { get } from './get';

export function runEach(host: object, cb: Func<[any], void>): void {
  for (const key in host) {
    const fn = get(key, host);
    cb(fn);
  }
}
