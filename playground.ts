import { detectChanges } from './src/detect-changes';
import { ChangeDetective } from './src/types';

const numberArr: number[] = [];
const _value = detectChanges(numberArr);

const unsubscribe = _value[ChangeDetective].subscribe(change => {
  console.log(change);
});

_value.push(1);
_value.pop();

unsubscribe();
console.log(_value[ChangeDetective].changes);
console.log();
