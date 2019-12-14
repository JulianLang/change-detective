import { AllChangesType } from '../types';

export function getFromMap(map: Map<any, any>, key: PropertyKey | AllChangesType) {
  return map.get(key) || [];
}

export function add(subject: any, map: Map<any, any>, key: PropertyKey | AllChangesType) {
  const mapContents = getFromMap(map, key);
  mapContents.push(subject);
  map.set(key, mapContents);
}
