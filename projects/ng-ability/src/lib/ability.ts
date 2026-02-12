import { AbilityMatcher, GlobalAbility } from './interfaces';

const abilityMatchersMap = new WeakMap<Function, AbilityMatcher<unknown>[]>();
const globalAbilitiesSet = new WeakSet<Function>();

export function getAbilityMatchers(
  klass: Function,
): AbilityMatcher<unknown>[] | undefined {
  return abilityMatchersMap.get(klass);
}

export function isGlobalAbility(klass: Function): boolean {
  return globalAbilitiesSet.has(klass);
}

export function AbilityFor<T>(global: typeof GlobalAbility): ClassDecorator;
export function AbilityFor<T>(
  ...abilityMatchers: AbilityMatcher<T>[]
): ClassDecorator;
export function AbilityFor<T>(
  ...abilityMatchers: (AbilityMatcher<T> | typeof GlobalAbility)[]
): ClassDecorator {
  return <TFunction extends Function>(klass: TFunction) => {
    // Check if this is a global ability
    if (abilityMatchers[0] === GlobalAbility) {
      globalAbilitiesSet.add(klass);
      // Don't store GlobalAbility symbol in matchers map
      abilityMatchersMap.set(klass, []);
    } else {
      abilityMatchersMap.set(
        klass,
        abilityMatchers as AbilityMatcher<unknown>[],
      );
    }

    return klass;
  };
}
