import { unequalDetector } from './detectors';
import { initialPropertyAddedInterceptor } from './interceptors';
import { installChangeDetection } from './modules';
import {
  AllChangesSymbol,
  AllChangesType,
  ChangeDetectable,
  ChangeDetectableFarcade,
  ChangeDetector,
  ChangeDetectors,
  ChangeType,
  DetectOptions,
  Func,
  Interceptors,
  Member,
  Nullable,
  PropertyChange,
  PropertyChanges,
  SubscribeCallback,
} from './types';
import { runEach } from './util';

const AllChanges = { [AllChangesSymbol]: true };
const defaultOpts: DetectOptions = {
  detectPropertyAdding: false,
  detectPropertyRemoving: false,
};
const builtInInterceptors: Interceptors = {
  initialPropertyAddedInterceptor,
};
const builtInDetectors: ChangeDetectors = {
  unequalDetector,
};
let changeDetectors: ChangeDetectors = {
  ...builtInDetectors,
};
let changeInterceptors: Interceptors = {
  ...builtInInterceptors,
};

export function addCustomDetectors(detectors: ChangeDetectors): void {
  changeDetectors = {
    ...changeDetectors,
    ...detectors,
    ...builtInDetectors,
  };
}

export function addCustomInterceptors(interceptors: Interceptors): void {
  changeInterceptors = {
    ...builtInInterceptors,
    ...changeInterceptors,
    ...interceptors,
  };
}

export function resetCustomInterceptors() {
  changeInterceptors = {
    ...builtInInterceptors,
  };
}

export function resetCustomDetectors() {
  changeDetectors = {
    ...builtInDetectors,
  };
}

export function detectChanges<T extends {}>(
  value: T,
  opts: DetectOptions = defaultOpts,
): T & ChangeDetectable {
  const ChangeDetectiveFarcade: ChangeDetectableFarcade<T> = {
    subscribe,
    hasChanges,
    resetChanges,
    changes,
  };

  const options = { ...defaultOpts, ...opts };
  const proxy: T = installChangeDetection(
    value,
    options,
    runChangeDetection,
    ChangeDetectiveFarcade,
  );

  const subscribers: Map<PropertyKey | AllChangesType, SubscribeCallback<T>[]> = new Map();
  let changesMap: Map<keyof T | AllChangesType, PropertyChanges<Member<T>>> = new Map();
  let lastRegisteredChange: PropertyChange;

  return proxy as T & ChangeDetectable;

  function runChangeDetection(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    type: ChangeType,
  ): void {
    const detectedChanges: PropertyKey[] = [];

    if (shouldInterceptChange(current, previous, property, target, type)) {
      return;
    }

    detectChange(current, previous, property, target, type, detectedChanges);
  }

  function detectChange(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    type: ChangeType,
    detectedChanges: PropertyKey[],
  ) {
    runEach(changeDetectors, detector => {
      const change = runDetector(detector, current, previous, property, target, type);

      if (change && !detectedChanges.includes(property)) {
        detectedChanges.push(property);
        addChange(change, property);
      }
    });
  }

  function shouldInterceptChange(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    type: ChangeType,
  ) {
    let isChangeIntercepted = false;

    runEach(changeInterceptors, interceptor => {
      const result = interceptor(current, previous, property, target, type);

      switch (result) {
        case 'is-change':
          isChangeIntercepted = false;
          break;
        case 'no-change':
          isChangeIntercepted = true;
          break;
      }
    });

    return isChangeIntercepted;
  }

  function runDetector(
    detect: ChangeDetector,
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    type: ChangeType,
  ): Nullable<PropertyChange> {
    if (detect(current, previous, property, target, type)) {
      return {
        property,
        current,
        previous,
        type,
      };
    }

    return null;
  }

  function resetChanges() {
    changesMap = new Map();
  }

  function hasChanges(): boolean {
    return changesMap.size > 0;
  }

  function changes(property?: keyof T): PropertyChanges | PropertyChanges[] {
    if (property === undefined) {
      return changesMap.get(AllChanges) || [];
    }

    return changesMap.get(property) || [];
  }

  function addChange(change: PropertyChange<Member<T>>, property: PropertyKey): void {
    if (isDifferent(change, lastRegisteredChange)) {
      lastRegisteredChange = change;
      add(change, changesMap, property);
      add(change, changesMap, AllChanges);
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

  function subscribe(
    subscriber: SubscribeCallback<T>,
    property: PropertyKey | AllChangesType = AllChanges,
  ): Func<[], void> {
    add(subscriber, subscribers, property);

    return () => removeSubscriber(subscriber, property);
  }

  function notifySubscribers(key: PropertyKey | AllChangesType, change: PropertyChange<Member<T>>) {
    const propertySubscribers: SubscribeCallback[] = getFromMap(subscribers, key);
    const allSubscribers: SubscribeCallback[] = getFromMap(subscribers, AllChanges);

    for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
      subscriber(change);
    }
  }

  function getFromMap(map: Map<any, any>, key: PropertyKey | AllChangesType) {
    return map.get(key) || [];
  }

  function add(subject: any, map: Map<any, any>, key: PropertyKey | AllChangesType) {
    const mapContents = getFromMap(map, key);
    mapContents.push(subject);
    map.set(key, mapContents);
  }

  function removeSubscriber(
    subscriber: SubscribeCallback<T>,
    key: PropertyKey | AllChangesType,
  ): void {
    const currentSubscribers: SubscribeCallback[] = getFromMap(subscribers, key);
    const filteredSubscribers = currentSubscribers.filter(s => s !== subscriber);

    subscribers.set(key, filteredSubscribers);
  }
}
