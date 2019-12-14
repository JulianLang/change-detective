import {
  addCustomDetectors,
  addCustomInterceptors,
  detectChanges,
  resetCustomDetectors,
  resetCustomInterceptors,
} from '../src/detect-changes';
import { ChangeDetective, DetectOptions, SubscribeCallback } from '../src/types';
import { get, set } from '../src/util';

describe('detectChanges', () => {
  it('should proxy changes to original instance', () => {
    // arrange
    const value = { a: 12 };
    const _value = detectChanges(value);

    // act
    _value.a = 42;

    // assert
    expect(value.a).toBe(42);
  });

  it('should proxy symbols to original instance', () => {
    // arrange
    const TestSymbol = Symbol('test');
    const value = { a: 12 };
    const _value = detectChanges(value);

    // act
    set(TestSymbol, 42, _value);

    // assert
    expect(get(TestSymbol, value)).toBe(42);
  });

  it('should not proxy ChangeDetective symbol to original instance', () => {
    // arrange
    const value = { a: 12 };

    // act
    const _value = detectChanges(value);

    // assert
    expect(_value[ChangeDetective]).toBeDefined();
    expect(get(ChangeDetective, value)).not.toBeDefined();
  });

  it('should notify correct values on all change', () => {
    // arrange
    const value = { a: 12 };
    const _value = detectChanges(value);
    const unsubscribe = _value[ChangeDetective].subscribe(change => {
      // assert
      expect(change.property).toBe('a');
      expect(change.current).toBe(42);
      expect(change.previous).toBe(12);
      // clean up
      unsubscribe();
    });

    // act
    _value.a = 42;
  });

  it('should notify correct values on property change', () => {
    // arrange
    const value = { a: 12 };
    const _value = detectChanges(value);
    const assertCallback: SubscribeCallback<{ a: number }> = change => {
      // assert
      expect(change.property).toBe('a');
      expect(change.current).toBe(42);
      expect(change.previous).toBe(12);
      // clean up
      unsubscribe();
    };
    const unsubscribe = _value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    _value.a = 42;
  });

  it('should not notify a property change twice', () => {
    // arrange
    const value = { a: 12, b: true };
    const _value = detectChanges(value);
    const assertCallback = jasmine.createSpy('assertCallback');
    _value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    _value.a = 42;

    // assert
    expect(assertCallback).toHaveBeenCalledTimes(1);
  });

  it('should not notify a property change for the wrong property', () => {
    // arrange
    const value = { a: 12, b: true };
    const _value = detectChanges(value);
    const assertCallback = jasmine.createSpy('assertCallback');
    _value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    _value.b = false;

    // assert
    expect(assertCallback).not.toHaveBeenCalled();
  });

  it('should not state changes if there are none', () => {
    // arrange
    const value = { a: 12, b: true };

    // act
    const _value = detectChanges(value);

    // assert
    expect(_value[ChangeDetective].hasChanges()).toBe(false);
    expect(_value[ChangeDetective].changes().length).toBe(0);
  });

  it('should not mark as changed, if the value was reset, but did not change', () => {
    // arrange
    const value = { a: 42 };
    const _value = detectChanges(value);

    // act
    _value.a = 42; // same value

    // assert
    expect(_value[ChangeDetective].hasChanges()).toBeFalse();
  });

  fit('should track nested changes', () => {
    // arrange
    const host = {
      value: {
        a: 42,
        c: {
          d: true,
        },
      },
    };
    const _host = detectChanges(host);

    // act
    _host.value.a = 24;
    _host.value.c.d = false;

    // assert
    expect(_host[ChangeDetective].changes('value.a')).toEqual([
      {
        current: 24,
        previous: 42,
        property: 'value.a',
        type: 'changed',
      },
    ]);
    expect(_host[ChangeDetective].changes('value.c.d')).toEqual([
      {
        current: 24,
        previous: 42,
        property: 'value.a',
        type: 'changed',
      },
    ]);
    expect(_host[ChangeDetective].changes()).toEqual([
      {
        current: 24,
        previous: 42,
        property: 'value.a',
        type: 'changed',
      },
      {
        current: 24,
        previous: 42,
        property: 'value.a',
        type: 'changed',
      },
    ]);
  });

  it('should track changes if there are some', () => {
    // arrange
    const value = { a: 12, b: true };
    const _value = detectChanges(value);

    // act
    _value.a = 24;
    _value.b = false;

    // assert
    expect(_value[ChangeDetective].hasChanges()).toBe(true);
    expect(_value[ChangeDetective].changes().length).toBe(2);
    expect(_value[ChangeDetective].changes('a')).toEqual([
      {
        property: 'a',
        current: 24,
        previous: 12,
        type: 'changed',
      },
    ]);
    expect(_value[ChangeDetective].changes('b')).toEqual([
      {
        property: 'b',
        current: false,
        previous: true,
        type: 'changed',
      },
    ]);
  });

  it('should track multiple changes for a single property', () => {
    // arrange
    const value = { a: 12 };
    const _value = detectChanges(value);

    // act
    _value.a = 24;
    _value.a = 42;

    // assert
    expect(_value[ChangeDetective].changes('a')).toEqual([
      {
        property: 'a',
        previous: 12,
        current: 24,
        type: 'changed',
      },
      {
        property: 'a',
        previous: 24,
        current: 42,
        type: 'changed',
      },
    ]);
  });

  it('should respect detectPropertyAdding option', () => {
    // arrange
    const opts: DetectOptions = { detectPropertyAdding: true };
    const obj = { a: 12 };

    // act
    const _obj = detectChanges(obj, opts);
    (_obj as any).b = true;

    // assert
    expect(_obj[ChangeDetective].changes().length).toBe(1);
    expect(_obj[ChangeDetective].changes('b')).toEqual([
      {
        current: true,
        previous: undefined,
        property: 'b',
        type: 'added',
      },
    ]);
  });

  it('should not announce initial added changes', () => {
    // arrange
    const opts: DetectOptions = { detectPropertyAdding: true };
    const obj = { a: 12 };

    // act
    const _obj = detectChanges(obj, opts);
    _obj.a = 21;

    // assert
    expect(_obj[ChangeDetective].changes().length).toBe(1);
    expect(_obj[ChangeDetective].changes('a')).toEqual([
      {
        current: 21,
        previous: 12,
        property: 'a',
        type: 'changed',
      },
    ]);
  });

  it('should respect detectPropertyRemoving option', () => {
    // arrange
    const opts: DetectOptions = { detectPropertyRemoving: true };
    const obj = { a: 12 };

    // act
    const _obj = detectChanges(obj, opts);
    delete _obj.a;

    // assert
    expect(_obj[ChangeDetective].changes().length).toBe(1);
    expect(_obj[ChangeDetective].changes('a')).toEqual([
      {
        current: undefined,
        previous: 12,
        property: 'a',
        type: 'removed',
      },
    ]);
  });

  it('should call custom interceptors', () => {
    // arrange
    const fakeInterceptor = jasmine.createSpy();
    addCustomInterceptors({ fakeInterceptor });
    const _value: number[] = detectChanges([]);

    // act
    _value.push(12);

    // assert
    expect(fakeInterceptor).toHaveBeenCalled();

    // clean up
    resetCustomInterceptors();
  });

  it('should resetCustomInterceptors', () => {
    // arrange
    const fakeInterceptor = jasmine.createSpy();
    addCustomInterceptors({ fakeInterceptor });
    const _value: number[] = detectChanges([]);

    // act
    resetCustomInterceptors();
    _value.push(12);

    // assert
    expect(fakeInterceptor).not.toHaveBeenCalled();
  });

  it('should call custom detectors', () => {
    // arrange
    const fakeDetector = jasmine.createSpy();
    addCustomDetectors({ fakeDetector });
    const _value: number[] = detectChanges([]);

    // act
    _value.push(12);

    // assert
    expect(fakeDetector).toHaveBeenCalled();

    // clean up
    resetCustomDetectors();
  });

  it('should resetCustomDetectors', () => {
    // arrange
    const fakeDetector = jasmine.createSpy();
    addCustomDetectors({ fakeDetector });
    const _value: number[] = detectChanges([]);

    // act
    resetCustomDetectors();
    _value.push(12);

    // assert
    expect(fakeDetector).not.toHaveBeenCalled();
  });

  it('resetChanges should empty changes map', () => {
    // arrange
    const _value = detectChanges([] as number[]);
    _value.push(1);

    // pre-condition
    expect(_value[ChangeDetective].hasChanges()).toBe(true);

    // act
    _value[ChangeDetective].resetChanges();

    // assert
    expect(_value[ChangeDetective].hasChanges()).toBe(false);
  });
});
