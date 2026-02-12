import { inject, Injectable } from '@angular/core';
import {
  type AbilityActions,
  type AbilityActionsOf,
  type AbilityActionFor,
  type Ability,
  type AbilityMatcher,
} from './interfaces';
import { getAbilityMatchers, isGlobalAbility } from './ability';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.tokens';

const inability: Ability<unknown, unknown> = { can: () => false };

@Injectable({ providedIn: 'root' })
export class NgAbilityService {
  private readonly context = inject(ABILITY_CONTEXT);
  private readonly abilities = inject(ABILITY);

  can<M extends keyof AbilityActions>(
    matcher: M,
    action: AbilityActions[NoInfer<M>],
    thing?: unknown,
  ): boolean;
  can<K extends keyof AbilityActions>(
    matcher: new (...args: never[]) => AbilityActionsOf<K>,
    action: AbilityActions[NoInfer<K>],
    thing?: unknown,
  ): boolean;
  can<M>(matcher: M, action: AbilityActionFor<NoInfer<M>>): boolean;
  can<T, M extends AbilityMatcher<T>>(
    matcher: M,
    action: AbilityActionFor<NoInfer<M>>,
    thing: T,
  ): boolean;
  can(matcherOrThing: unknown, action: string, thing?: unknown): boolean {
    if (arguments.length === 2) {
      thing = matcherOrThing;
    }

    const currentContext = this.context.abilityContext();

    // Check all global abilities first - all must return true
    for (const ability of this.abilities) {
      if (isGlobalAbility(ability.constructor)) {
        if (!ability.can(currentContext, action, thing)) {
          return false;
        }
      }
    }

    // If all global abilities passed (or there are none), check specific ability
    return Boolean(
      this.getAbility(matcherOrThing).can(currentContext, action, thing),
    );
  }

  private getAbility(thing: unknown): Ability<unknown, unknown> {
    return (
      this.abilities
        .filter((ability) => !isGlobalAbility(ability.constructor))
        .find((ability) => {
          const matchers = getAbilityMatchers(ability.constructor);

          if (!Array.isArray(matchers) || matchers.length === 0) {
            console.error(`Unable to match ability without matcher`, ability);
            return false;
          }

          return matchers.some((matcher) => this.matchAbility(matcher, thing));
        }) ?? inability
    );
  }

  private matchAbility(
    matcher: AbilityMatcher<unknown>,
    thing: unknown,
  ): boolean {
    if (matcher === thing) {
      return true;
    }

    if (typeof matcher === 'function') {
      try {
        if (thing instanceof matcher) {
          return true;
        }
      } catch (e) {
        // Arrow functions don't have prototype, instanceof will throw
      }

      try {
        // In case a class is passed, it might throw, therefore we try/catch
        // and cast the value to a function.
        return (matcher as (thing: unknown) => boolean)(thing) === true;
      } catch (e) {
        return false;
      }
    }

    return false;
  }
}
