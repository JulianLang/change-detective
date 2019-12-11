import {
  ChangeDetectable,
  ChangeDetectableContent,
  ChangeDetective,
  Func,
  Member,
  Nullable,
  PropertyChanges,
  SubscribeCallback,
} from './types';

export function detectChanges<T extends {}>(value: T): T & ChangeDetectable {
  const proxy: T = installChangeDetection();
  const changes: Map<keyof T, PropertyChanges<Member<T>>> = new Map();
  const subscribers: Map<Nullable<PropertyKey>, SubscribeCallback<T>[]> = new Map();

  return proxy as T & ChangeDetectable;

  function installChangeDetection(): T {
    return new Proxy(value, {
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
          updateChange(property, value, previous);
        }

        return success;
    }
  }

  function updateChange(property: PropertyKey, currentValue: any, previous: any): void {
    add(
      {
        current: currentValue,
        previous: previous,
        // TODO: langju: change in future to be set correctly
        type: 'setValue',
      },
      changes,
      property,
    );

    notifySubscribers(property, currentValue, previous);
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

  function notifySubscribers(property: Nullable<PropertyKey>, currentValue: any, previous: any) {
    const propertySubscribers = getContents(subscribers, property);
    const allSubscribers = getContents(subscribers, null);

    for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
      subscriber(property, currentValue, previous);
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
