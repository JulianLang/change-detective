import { detectChanges } from '../src/detect-changes';
import { ChangeDetective, SubscribeCallback } from '../src/types';

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
    _value[TestSymbol] = 42;

    // assert
    expect(value[TestSymbol]).toBe(42);
  });

  it('should not proxy ChangeDetective symbol to original instance', () => {
    // arrange
    const value = { a: 12 };

    // act
    const _value = detectChanges(value);

    // assert
    expect(_value[ChangeDetective]).toBeDefined();
    expect(value[ChangeDetective]).not.toBeDefined();
  });

  it('should notify correct values on all change', () => {
    // arrange
    const value = { a: 12 };
    const _value = detectChanges(value);
    const unsubscribe = _value[ChangeDetective].subscribe((property, current, previous) => {
      // assert
      expect(property).toBe('a');
      expect(current).toBe(42);
      expect(previous).toBe(12);
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
    const assertCallback: SubscribeCallback<{ a: number }> = (property, current, previous) => {
      // assert
      expect(property).toBe('a');
      expect(current).toBe(42);
      expect(previous).toBe(12);
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
    expect(_value[ChangeDetective].changes.size).toBe(0);
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

  it('should track changes if there are some', () => {
    // arrange
    const value = { a: 12, b: true };
    const _value = detectChanges(value);

    // act
    _value.a = 24;
    _value.b = false;

    // assert
    expect(_value[ChangeDetective].hasChanges()).toBe(true);
    expect(_value[ChangeDetective].changes.size).toBe(2);
    expect(_value[ChangeDetective].changes.get('a')).toEqual([
      {
        current: 24,
        previous: 12,
        type: 'setValue',
      },
    ]);
    expect(_value[ChangeDetective].changes.get('b')).toEqual([
      {
        current: false,
        previous: true,
        type: 'setValue',
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
    expect(_value[ChangeDetective].changes.get('a')).toEqual([
      {
        previous: 12,
        current: 24,
        type: 'setValue',
      },
      {
        previous: 24,
        current: 42,
        type: 'setValue',
      },
    ]);
  });
});
