import { detectChanges } from './src/detect-changes';
import { ChangeDetective } from './src/types';

const _value = detectChanges(
  {
    a: {
      b: 42,
      c: true,
    },
  },
  { strictComparison: false },
);

const unsubscribe = _value[ChangeDetective].subscribe(change => {
  console.log(change);
});

_value.a = {
  b: 42,
  c: true,
};

unsubscribe();
console.log(_value[ChangeDetective].changes());
console.log();
