import { detectChanges } from '../src/detect-changes';
import { ChangeDetective, SubscribeCallback } from '../src/types';

describe('detectChanges', () => {
  it('should proxy changes to original instance', () => {
    // arrange
    const value = { a: 12 };
    const $value = detectChanges(value);

    // act
    $value.a = 42;

    // assert
    expect(value.a).toBe(42);
  });

  it('should proxy symbols to original instance', () => {
    // arrange
    const TestSymbol = Symbol('test');
    const value = { a: 12 };
    const $value = detectChanges(value);

    // act
    $value[TestSymbol] = 42;

    // assert
    expect(value[TestSymbol]).toBe(42);
  });

  it('should not proxy ChangeDetective symbol to original instance', () => {
    // arrange
    const value = { a: 12 };

    // act
    const $value = detectChanges(value);

    // assert
    expect($value[ChangeDetective]).toBeDefined();
    expect(value[ChangeDetective]).not.toBeDefined();
  });

  it('should notify correct values on all change', () => {
    // arrange
    const value = { a: 12 };
    const $value = detectChanges(value);
    const unsubscribe = $value[ChangeDetective].subscribe((property, current, previous) => {
      // assert
      expect(property).toBe('a');
      expect(current).toBe(42);
      expect(previous).toBe(12);
      // clean up
      unsubscribe();
    });

    // act
    $value.a = 42;
  });

  it('should notify correct values on property change', () => {
    // arrange
    const value = { a: 12 };
    const $value = detectChanges(value);
    const assertCallback: SubscribeCallback<{ a: number }> = (property, current, previous) => {
      // assert
      expect(property).toBe('a');
      expect(current).toBe(42);
      expect(previous).toBe(12);
      // clean up
      unsubscribe();
    };
    const unsubscribe = $value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    $value.a = 42;
  });

  it('should not notify a property change twice', () => {
    // arrange
    const value = { a: 12, b: true };
    const $value = detectChanges(value);
    const assertCallback = jasmine.createSpy('assertCallback');
    $value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    $value.a = 42;

    // assert
    expect(assertCallback).toHaveBeenCalledTimes(1);
  });

  it('should not notify a property change for the wrong property', () => {
    // arrange
    const value = { a: 12, b: true };
    const $value = detectChanges(value);
    const assertCallback = jasmine.createSpy('assertCallback');
    $value[ChangeDetective].subscribe(assertCallback, 'a');

    // act
    $value.b = false;

    // assert
    expect(assertCallback).not.toHaveBeenCalled();
  });

  it('should not state changes if there are none', () => {
    // arrange
    const value = { a: 12, b: true };

    // act
    const $value = detectChanges(value);

    // assert
    expect($value[ChangeDetective].hasChanges()).toBe(false);
    expect($value[ChangeDetective].changes.size).toBe(0);
  });

  it('should track changes if there are some', () => {
    // arrange
    const value = { a: 12, b: true };
    const $value = detectChanges(value);

    // act
    $value.a = 24;
    $value.b = false;

    // assert
    expect($value[ChangeDetective].hasChanges()).toBe(true);
    expect($value[ChangeDetective].changes.size).toBe(2);
    expect($value[ChangeDetective].changes.get('a')).toEqual([
      {
        current: 24,
        previous: 12,
        type: 'setValue',
      },
    ]);
    expect($value[ChangeDetective].changes.get('b')).toEqual([
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
    const $value = detectChanges(value);

    // act
    $value.a = 24;
    $value.a = 42;

    // assert
    expect($value[ChangeDetective].changes.get('a')).toEqual([
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
