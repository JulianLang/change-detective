import { AllChanges } from './constants';
import { unequalDetector } from './detectors';
import { installChangeDetection, notifySubscribers, subscribe } from './modules';
import {
  AllChangesType,
  ChangeDetectable,
  ChangeDetectableFarcade,
  ChangeDetector,
  DetectOptions,
  Interceptor,
  Member,
  PropertyChange,
  PropertyChanges,
  SubscribeCallback,
} from './types';
import { add, toPropertyPath } from './util';

const defaultOpts: DetectOptions = {
  detectPropertyRemoving: true,
};

let changeInterceptor: Interceptor = () => null;
let changeDetector: ChangeDetector = unequalDetector;

export function useCustomChangeDetector(detector: ChangeDetector): void {
  changeDetector = detector;
}

export function useCustomInterceptor(interceptor: Interceptor): void {
  changeInterceptor = interceptor;
}

export function resetCustomInterceptors() {
  changeInterceptor = () => null;
}

export function resetCustomDetectors() {
  changeDetector = unequalDetector;
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

    if (changeInterceptor(current, previous, property, target)) {
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

    if (changeDetector(current, previous, propertyPath, target)) {
      addChange(
        {
          property: propertyPath,
          current,
          previous,
        },
        property,
        propertyPath,
      );
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
