import { isArray } from '../util';

export const arrayDetectors = {
  lengthChange: reportLenghtChange,
};

function reportLenghtChange(_: any, __: any, property: PropertyKey, target: any): boolean {
  if (!isArray(target)) {
    return null;
  }

  return null;
}
