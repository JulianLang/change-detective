import { Interceptor } from './interceptor';

export interface Interceptors {
  [key: string]: Interceptor;
}
