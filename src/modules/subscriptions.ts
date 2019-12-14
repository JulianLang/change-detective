import { AllChanges } from '../constants';
import { AllChangesType, Func, PropertyChange, SubscribeCallback } from '../types';
import { add, getFromMap } from '../util';

export function subscribe<T>(
  subscriber: SubscribeCallback<T>,
  property: PropertyKey | AllChangesType = AllChanges,
  toSubscribers: Map<PropertyKey | AllChangesType, SubscribeCallback[]>,
): Func<[], void> {
  add(subscriber, toSubscribers, property);

  return () => removeSubscriber(subscriber, property, toSubscribers);
}

export function notifySubscribers<T>(
  key: PropertyKey | AllChangesType,
  change: PropertyChange<T>,
  subscribers: Map<PropertyKey | AllChangesType, SubscribeCallback[]>,
) {
  const propertySubscribers: SubscribeCallback[] = getFromMap(subscribers, key);
  const allSubscribers: SubscribeCallback[] = getFromMap(subscribers, AllChanges);

  for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
    subscriber(change);
  }
}

function removeSubscriber<T>(
  subscriber: SubscribeCallback<T>,
  key: PropertyKey | AllChangesType,
  subscribers: Map<PropertyKey | AllChangesType, SubscribeCallback[]>,
): void {
  const currentSubscribers: SubscribeCallback[] = getFromMap(subscribers, key);
  const filteredSubscribers = currentSubscribers.filter(s => s !== subscriber);

  subscribers.set(key, filteredSubscribers);
}
