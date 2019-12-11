import { Nullable, PropertyChange } from '../types';
import { isArray } from '../util';

export const arrayDetectors = {
  lengthChange: reportLenghtChange,
};

function reportLenghtChange(
  _: any,
  __: any,
  property: PropertyKey,
  target: any,
): Nullable<PropertyChange> {
  if (!isArray(target)) {
    return null;
  }

  return null;
}
