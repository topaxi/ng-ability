import { AbilityMatcher } from './interfaces';

const abilityMatchersMap = new WeakMap<Function, AbilityMatcher<unknown>[]>();

export function getAbilityMatchers(
  klass: Function,
): AbilityMatcher<unknown>[] | undefined {
  return abilityMatchersMap.get(klass);
}

export function AbilityFor<T>(
  ...abilityMatchers: AbilityMatcher<T>[]
): ClassDecorator {
  return <TFunction extends Function>(klass: TFunction) => {
    abilityMatchersMap.set(klass, abilityMatchers as AbilityMatcher<unknown>[]);
    return klass;
  };
}
