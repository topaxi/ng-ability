import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { type AbilityActions, type Action, type Ability, type AbilityMatcher, type AbilityContext } from './interfaces';
import { getAbilityMatchers } from './ability';

const nullContext: AbilityContext<null> = { abilityContext: signal(null) };
const inability: Ability<unknown, unknown> = { can: () => false };

export const ABILITY_CONTEXT = new InjectionToken<AbilityContext<unknown>>(
  'AbilityContext',
  { factory: () => nullContext },
);
export const ABILITY = new InjectionToken<
  ReadonlyArray<Ability<unknown, unknown>>
>('Ability', { factory: () => [] });

@Injectable({ providedIn: 'root' })
export class NgAbilityService {
  private readonly context = inject(ABILITY_CONTEXT);
  private readonly abilities = inject(ABILITY);

  can<M extends keyof AbilityActions>(matcher: M, action: AbilityActions[M] | (string & {}), thing?: unknown): boolean;
  can(matcher: unknown, action: Action): boolean;
  can<T>(matcher: AbilityMatcher<T>, action: Action, thing: T): boolean;
  can(matcherOrThing: unknown, action: string, thing?: unknown): boolean {
    if (arguments.length === 2) {
      thing = matcherOrThing;
    }

    return Boolean(
      this.getAbility(matcherOrThing).can(
        this.context.abilityContext(),
        action,
        thing,
      ),
    );
  }

  private getAbility(thing: unknown): Ability<unknown, unknown> {
    return (
      this.abilities.find((ability) => {
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
