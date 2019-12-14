import {
  ChangeDetectableFarcade,
  ChangeDetective,
  ChangeType,
  DetectOptions,
  Func,
  Member,
} from '../types';
import { get } from '../util';

export function installChangeDetection<T extends {}>(
  original: T,
  options: DetectOptions,
  runChangeDetection: Func<
    [Member<T> | undefined, Member<T> | undefined, PropertyKey, any, ChangeType],
    void
  >,
  currentFarcade: ChangeDetectableFarcade<T>,
): T {
  return new Proxy(original, {
    deleteProperty(target, property) {
      if (options.detectPropertyRemoving) {
        runChangeDetection(undefined, get(property, target), property, target, 'removed');
      }

      return Reflect.deleteProperty(target, property);
    },
    defineProperty(target, property, attr) {
      if (options.detectPropertyAdding) {
        runChangeDetection(attr.value, undefined, property, target, 'added');
      }

      return Reflect.defineProperty(target, property, attr);
    },
    get(target, property, receiver) {
      return getProperty(target, property, receiver);
    },
    set(target, property, value, receiver) {
      return setProperty(target, property, value, receiver);
    },
  });

  function getProperty(target: any, property: PropertyKey, receiver: any): any {
    switch (property) {
      case ChangeDetective:
        return currentFarcade;
      default:
        return Reflect.get(target, property, receiver);
    }
  }

  function setProperty(target: any, property: PropertyKey, value: any, receiver: any) {
    switch (property) {
      case ChangeDetective:
        return true;
      default:
        const previous = Reflect.get(target, property, receiver);
        const success = Reflect.set(target, property, value, receiver);

        if (success) {
          runChangeDetection(value, previous, property, target, 'changed');
        }

        return success;
    }
  }
}
