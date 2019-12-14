import { ChangeMarker } from './change.marker';
import { ChangeType } from './change.type';
import { Nullable } from './nullable';

export interface Interceptor {
  (cuurent: any, previous: any, property: PropertyKey, target: any, type: ChangeType): Nullable<
    ChangeMarker
  >;
}
