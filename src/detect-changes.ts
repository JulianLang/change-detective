import { arrayDetectors, unequalDetector } from './detectors';
import {
  ChangeDetectable,
  ChangeDetectableContent,
  ChangeDetective,
  ChangeDetectors,
  ChangeType,
  Func,
  Member,
  Nullable,
  PropertyChange,
  PropertyChanges,
  SubscribeCallback,
} from './types';

const builtInDetectors: ChangeDetectors = {
  unequalDetector,
  ...arrayDetectors,
};
let changeDetectors: ChangeDetectors = {
  ...builtInDetectors,
};

export function addCustomDetectors(detectors: ChangeDetectors): void {
  changeDetectors = {
    ...builtInDetectors,
    ...changeDetectors,
    ...detectors,
  };
}

export function detectChanges<T extends {}>(value: T): T & ChangeDetectable {
  const proxy: T = installChangeDetection();
  const changes: Map<keyof T, PropertyChanges<Member<T>>> = new Map();
  const subscribers: Map<Nullable<PropertyKey>, SubscribeCallback<T>[]> = new Map();

  return proxy as T & ChangeDetectable;

  function installChangeDetection(): T {
    return new Proxy(value, {
      deleteProperty(target, property) {
        runChangeDetection(undefined, target[property], property, target, 'removed');

        return Reflect.deleteProperty(target, property);
      },
      defineProperty(target, property, attr) {
        runChangeDetection(attr.value, undefined, property, target, 'added');

        return Reflect.defineProperty(target, property, attr);
      },
      get(target, property, receiver) {
        return getProperty(target, property, receiver);
      },
      set(target, property, value, receiver) {
        return setProperty(target, property, value, receiver);
      },
      apply(target, thisArg, args: any[]) {
        return applyFn(target, thisArg, args);
      },
    });
  }

  function applyFn(target: any, thisArg: any, args: any[]) {
    return Reflect.apply(target, thisArg, args);
  }

  function getProperty(target: any, property: PropertyKey, receiver: any): any {
    switch (property) {
      case ChangeDetective:
        const contents: ChangeDetectableContent<T> = {
          subscribe,
          changes,
          hasChanges,
        };

        return contents;
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

  function runChangeDetection(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    type: ChangeType,
  ): void {
    for (const key in changeDetectors) {
      const detect = changeDetectors[key];

      if (detect(current, previous, property, target)) {
        addChange(
          {
            current,
            previous,
            type,
          },
          property,
        );
      }
    }
  }

  function addChange(change: PropertyChange<Member<T>>, property: PropertyKey): void {
    add(change, changes, property);
    notifySubscribers(property, change);
  }

  function hasChanges(): boolean {
    return changes.size > 0;
  }

  function subscribe(
    subscriber: SubscribeCallback<T>,
    property: Nullable<PropertyKey> = null,
  ): Func<[], void> {
    add(subscriber, subscribers, property);

    return () => removeSubscriber(subscriber, property);
  }

  function notifySubscribers(property: Nullable<PropertyKey>, change: PropertyChange<Member<T>>) {
    const propertySubscribers = getContents(subscribers, property);
    const allSubscribers = getContents(subscribers, null);

    for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
      subscriber(property, change.current, change.previous);
    }
  }

  function getContents(map: Map<any, any>, property: Nullable<PropertyKey>) {
    return map.get(property) || [];
  }

  function add(subject: any, to: Map<any, any>, forProperty: Nullable<PropertyKey>) {
    const mapContents = getContents(to, forProperty);
    mapContents.push(subject);
    to.set(forProperty, mapContents);
  }

  function removeSubscriber(
    subscriber: SubscribeCallback<T>,
    property: Nullable<PropertyKey>,
  ): void {
    const currentSubscribers = subscribers.get(property);
    const filteredSubscribers = currentSubscribers.filter(s => s !== subscriber);

    subscribers.set(property, filteredSubscribers);
  }
}
