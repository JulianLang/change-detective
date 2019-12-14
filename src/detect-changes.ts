import { unequalDetector } from './detectors';
import { initialPropertyAddedInterceptor } from './interceptors';
import {
  AllChangesSymbol,
  AllChangesType,
  ChangeDetectable,
  ChangeDetectableContent,
  ChangeDetective,
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
import { get, runEach } from './util';

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
  const options = { ...defaultOpts, ...opts };
  const proxy: T = installChangeDetection();
  const subscribers: Map<PropertyKey | AllChangesType, SubscribeCallback<T>[]> = new Map();
  let changes: Map<keyof T | AllChangesType, PropertyChanges<Member<T>>> = new Map();
  let lastRegisteredChange: PropertyChange;

  return proxy as T & ChangeDetectable;

  function installChangeDetection(): T {
    return new Proxy(value, {
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
  }

  function getProperty(target: any, property: PropertyKey, receiver: any): any {
    switch (property) {
      case ChangeDetective:
        const contents: ChangeDetectableContent<T> = {
          subscribe,
          hasChanges,
          resetChanges,
          changes: getChanges,
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

  function addChange(change: PropertyChange<Member<T>>, property: PropertyKey): void {
    if (isDifferent(change, lastRegisteredChange)) {
      lastRegisteredChange = change;
      add(change, changes, property);
      add(change, changes, AllChanges);
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

  function getChanges(property?: keyof T): PropertyChanges | PropertyChanges[] {
    if (property === undefined) {
      return changes.get(AllChanges) || [];
    }

    return changes.get(property) || [];
  }

  function resetChanges() {
    changes = new Map();
  }

  function hasChanges(): boolean {
    return changes.size > 0;
  }

  function subscribe(
    subscriber: SubscribeCallback<T>,
    property: PropertyKey | AllChangesType = AllChanges,
  ): Func<[], void> {
    add(subscriber, subscribers, property);

    return () => removeSubscriber(subscriber, property);
  }

  function notifySubscribers(
    property: PropertyKey | AllChangesType,
    change: PropertyChange<Member<T>>,
  ) {
    const propertySubscribers: SubscribeCallback[] = getContents(subscribers, property);
    const allSubscribers: SubscribeCallback[] = getContents(subscribers, AllChanges);

    for (const subscriber of [...propertySubscribers, ...allSubscribers]) {
      subscriber(change);
    }
  }

  function getContents(map: Map<any, any>, property: PropertyKey | AllChangesType) {
    return map.get(property ? property : AllChanges) || [];
  }

  function add(subject: any, to: Map<any, any>, property: PropertyKey | AllChangesType) {
    const mapContents = getContents(to, property);
    mapContents.push(subject);
    to.set(property, mapContents);
  }

  function removeSubscriber(
    subscriber: SubscribeCallback<T>,
    property: PropertyKey | AllChangesType,
  ): void {
    const currentSubscribers: SubscribeCallback[] = getContents(subscribers, property);
    const filteredSubscribers = currentSubscribers.filter(s => s !== subscriber);

    subscribers.set(property, filteredSubscribers);
  }
}
