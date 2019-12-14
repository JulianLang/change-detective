import { ChangeDetectableFarcade, ChangeDetective, DetectOptions, Func, Member } from '../types';
import { get, toPropertyPath } from '../util';

export function installChangeDetection<T extends {}>(
  original: T,
  options: DetectOptions,
  runChangeDetection: Func<
    [Member<T> | undefined, Member<T> | undefined, PropertyKey, any, string],
    void
  >,
  currentFarcade: ChangeDetectableFarcade<T>,
  baseVarPath: string,
): T {
  return new Proxy(original, {
    deleteProperty(target, property) {
      if (options.detectPropertyRemoving) {
        runChangeDetection(undefined, get(property, target), property, target, baseVarPath);
      }

      return Reflect.deleteProperty(target, property);
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
        const requested = Reflect.get(target, property, receiver);
        return options.deepDetection && typeof requested === 'object'
          ? installChangeDetection(
              requested,
              options,
              runChangeDetection,
              currentFarcade,
              toPropertyPath(baseVarPath, property),
            )
          : requested;
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
          runChangeDetection(value, previous, property, target, baseVarPath);
        }

        return success;
    }
  }
}
