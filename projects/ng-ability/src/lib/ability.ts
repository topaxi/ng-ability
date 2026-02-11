import { AbilityMatcher } from './interfaces';

const abilityMatchersMap = new WeakMap<Function, AbilityMatcher<any>[]>();

export function getAbilityMatchers(klass: Function): AbilityMatcher<any>[] | undefined {
  return abilityMatchersMap.get(klass);
}

export function AbilityFor<T>(...abilityMatchers: AbilityMatcher<T>[]): any {
  return (klass: Function) => {
    abilityMatchersMap.set(klass, abilityMatchers);
    return klass;
  };
}
