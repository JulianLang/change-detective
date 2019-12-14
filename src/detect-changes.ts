import { AllChanges } from './constants';
import { unequalDetector } from './detectors';
import { installChangeDetection, notifySubscribers, subscribe } from './modules';
import {
  AllChangesType,
  ChangeDetectable,
  ChangeDetectableFarcade,
  ChangeDetector,
  ChangeDetectors,
  DetectOptions,
  Interceptors,
  Member,
  Nullable,
  PropertyChange,
  PropertyChanges,
  SubscribeCallback,
} from './types';
import { add, runEach, toPropertyPath } from './util';

const defaultOpts: DetectOptions = {
  detectPropertyAdding: false,
  detectPropertyRemoving: false,
};
const builtInInterceptors: Interceptors = {
  // none needed yet
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
  baseVarPath = '',
): T & ChangeDetectable {
  const subscribers: Map<PropertyKey | AllChangesType, SubscribeCallback<T>[]> = new Map();
  const ChangeDetectiveFarcade: ChangeDetectableFarcade<T> = {
    subscribe: (handler, property) => subscribe(handler, property, subscribers),
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
    baseVarPath,
  );

  let changesMap: Map<keyof T | AllChangesType, PropertyChanges<Member<T>>> = new Map();
  let lastRegisteredChange: PropertyChange;

  return proxy as T & ChangeDetectable;

  function runChangeDetection(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    currentVarPath: string,
  ): void {
    const detectedChanges: PropertyKey[] = [];

    if (shouldInterceptChange(current, previous, property, target)) {
      return;
    }

    detectChange(current, previous, property, target, detectedChanges, currentVarPath);
  }

  function detectChange(
    current: any,
    previous: any,
    property: PropertyKey,
    target: any,
    detectedChanges: PropertyKey[],
    currentVarPath: string,
  ) {
    const propertyPath = toPropertyPath(currentVarPath, property);

    runEach(changeDetectors, detector => {
      const change = runDetector(detector, current, previous, propertyPath, target);

      if (change && !detectedChanges.includes(propertyPath)) {
        detectedChanges.push(propertyPath);
        addChange(change, property, propertyPath);
      }
    });
  }

  function shouldInterceptChange(current: any, previous: any, property: PropertyKey, target: any) {
    let isChangeIntercepted = false;

    runEach(changeInterceptors, interceptor => {
      const result = interceptor(current, previous, property, target);

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
    propertyPath: string,
    target: any,
  ): Nullable<PropertyChange> {
    if (detect(current, previous, propertyPath, target)) {
      return {
        property: propertyPath,
        current,
        previous,
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

  function addChange(change: PropertyChange<T>, property: PropertyKey, fullVarPath: string): void {
    if (isDifferent(change, lastRegisteredChange)) {
      lastRegisteredChange = change;
      add(change, changesMap, fullVarPath);
      add(change, changesMap, AllChanges);
      notifySubscribers(property, change, subscribers);
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
}
