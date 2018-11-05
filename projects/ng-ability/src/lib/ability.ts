import 'reflect-metadata';
import { AbilityMatcher } from './interfaces';

export function AbilityFor<T>(...abilityMatchers: AbilityMatcher<T>[]): any {
  return klass => {
    Reflect.defineMetadata('abilityMatchers', abilityMatchers, klass);

    return klass;
  };
}
