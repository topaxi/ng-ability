import { inject, Injectable, InjectionToken } from '@angular/core';
import { Ability, AbilityMatcher, AbilityContext } from './interfaces';
import { getAbilityMatchers } from './ability';

export const ABILITY_CONTEXT = new InjectionToken<AbilityContext<any>>(
  'AbilityContext'
);
export const ABILITY = new InjectionToken<Ability<any, any>[]>('Ability');

const nullContext: AbilityContext<null> = { getAbilityContext: () => null };
const inability: Ability<any, any> = { can: () => false };

@Injectable({ providedIn: 'root' })
export class NgAbilityService {
  private readonly context = inject(ABILITY_CONTEXT, { optional: true }) ?? nullContext;
  private readonly abilities = inject(ABILITY, { optional: true }) ?? [];

  can(action: string, thing: any): boolean;
  can(action: string, matcher: AbilityMatcher<any>, thing: any): boolean;
  can(action: string, matcher: any, thing?: any): boolean {
    if (arguments.length === 2) {
      thing = matcher;
    }

    return Boolean(this.getAbility(matcher).can(this.context.getAbilityContext(), action, thing));
  }

  private getAbility(thing: any): Ability<any, any> {
    return (
      this.abilities.find(ability => {
        const matchers = getAbilityMatchers(ability.constructor);

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
      try {
        if (thing instanceof (matcher as any)) {
          return true;
        }
      } catch (e) {
        // Arrow functions don't have prototype, instanceof will throw
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
