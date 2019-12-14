import { ChangeMarker } from './change.marker';
import { Nullable } from './internal/nullable';

export interface ChangeInterceptor {
  (cuurent: any, previous: any, property: PropertyKey, target: any): Nullable<ChangeMarker>;
}
