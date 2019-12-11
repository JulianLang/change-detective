import { ChangeDetectable } from './change-detectable';

export type ChangeDetective<T> = T & ChangeDetectable<T>;
