import { inject, Injectable, InjectionToken } from '@angular/core';
import { Ability, AbilityMatcher, AbilityContext } from './interfaces';
import { getAbilityMatchers } from './ability';

const nullContext: AbilityContext<null> = { getAbilityContext: () => null };
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

  can(action: string, thing: unknown): boolean;
  can(
    action: string,
    matcher: AbilityMatcher<unknown>,
    thing: unknown,
  ): boolean;
  can(action: string, matcher: unknown, thing?: unknown): boolean {
    if (arguments.length === 2) {
      thing = matcher;
    }

    return Boolean(
      this.getAbility(matcher).can(
        this.context.getAbilityContext(),
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
      }) || inability
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
