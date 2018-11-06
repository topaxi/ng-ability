import 'reflect-metadata';
import { Injectable, InjectionToken, Injector } from '@angular/core';
import { Ability, AbilityMatcher, AbilityContext } from './interfaces';

export const ABILITY_CONTEXT = new InjectionToken<AbilityContext<any>>(
  'AbilityContext'
);
export const ABILITY = new InjectionToken<Ability<any, any>[]>('Ability');

const nullContext: AbilityContext<null> = { getAbilityContext: () => null };
const inability: Ability<any, any> = { can: () => false };

@Injectable({ providedIn: 'root' })
export class NgAbilityService {
  private get context() {
    return this.injector.get(ABILITY_CONTEXT, nullContext).getAbilityContext();
  }

  private get abilities() {
    return this.injector.get(ABILITY, []);
  }

  constructor(private readonly injector: Injector) {}

  can(action: string, thing: any): boolean;
  can(action: string, matcher: AbilityMatcher<any>, thing: any): boolean;
  can(action: string, matcher: any, thing?: any): boolean {
    if (arguments.length === 2) {
      thing = matcher;
    }

    return Boolean(this.getAbility(matcher).can(this.context, action, thing));
  }

  private getAbility(thing: any): Ability<any, any> {
    return (
      this.abilities.find(ability => {
        const matchers: AbilityMatcher<any>[] = Reflect.getMetadata(
          'abilityMatchers',
          ability.constructor
        );

        if (!Array.isArray(matchers) || matchers.length === 0) {
          console.error(`Unable to match ability without matcher`, ability);
          return false;
        }

        return matchers.some(matcher => this.matchAbility(matcher, thing));
      }) || inability
    );
  }

  private matchAbility(matcher: AbilityMatcher<any>, thing: any): boolean {
    if (matcher === thing) {
      return true;
    }

    if (typeof matcher === 'function') {
      if (thing instanceof matcher) {
        return true;
      }

      try {
        return (matcher as any)(thing) === true;
      } catch (e) {
        return false;
      }
    }

    return false;
  }
}
