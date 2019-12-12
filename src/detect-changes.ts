import { unequalDetector } from './detectors';
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
};
let changeDetectors: ChangeDetectors = {
  ...builtInDetectors,
};

export function addCustomDetectors(detectors: ChangeDetectors): void {
  changeDetectors = {
    ...changeDetectors,
    ...detectors,
    ...builtInDetectors,
  };
}

export function detectChanges<T extends {}>(value: T): T & ChangeDetectable {
  const proxy: T = installChangeDetection();
  const changes: Map<keyof T, PropertyChanges<Member<T>>> = new Map();
  const subscribers: Map<Nullable<PropertyKey>, SubscribeCallback<T>[]> = new Map();
  let lastRegisteredChange: PropertyChange;

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
    });
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
    const detectedChanges: PropertyKey[] = [];

    for (const key in changeDetectors) {
      const detect = changeDetectors[key];

      if (detect(current, previous, property, target) && !detectedChanges.includes(property)) {
        detectedChanges.push(property);
        addChange(
          {
            property,
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
    if (isDifferent(change, lastRegisteredChange)) {
      lastRegisteredChange = change;
      add(change, changes, property);
      notifySubscribers(property, change);
    }
  }

  function isDifferent(change: PropertyChange, other: PropertyChange): boolean {
    if (change === undefined || other === undefined) {
      return true;
    }

    return (
      change.current !== other.current ||
      change.previous !== other.previous ||
      change.property !== other.property
    );
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
    const propertySubscribers: SubscribeCallback[] = getContents(subscribers, property);
    const allSubscribers: SubscribeCallback[] = getContents(subscribers, null);

    for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
      subscriber(change);
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
