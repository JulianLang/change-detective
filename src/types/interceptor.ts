import { ChangeMarker } from './change.marker';
import { Nullable } from './internal/nullable';

export interface Interceptor {
  (cuurent: any, previous: any, property: PropertyKey, target: any): Nullable<ChangeMarker>;
}
