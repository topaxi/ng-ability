import { inject, Injectable } from '@angular/core';
import {
  type AbilityActions,
  type AbilityActionsOf,
  type AbilityActionFor,
  type Ability,
  type AbilityMatcher,
} from './interfaces';
import { getAbilityMatchers, isGlobalAbility } from './ability';
import {
  ABILITY,
  ABILITY_CONTEXT,
  ABILITY_LOGGER,
  ABILITY_MISSING_HANDLER,
} from './ng-ability.tokens';
import { AbilityMissingError } from './errors';
import type { AbilityLogger } from './ng-ability.tokens';

const inability: Ability<unknown, unknown> = { can: () => false };

function prefixedLogger(logger: AbilityLogger): AbilityLogger {
  return {
    debug: (msg, ...args) => logger.debug(`[ng-ability] ${msg}`, ...args),
    warn: (msg, ...args) => logger.warn(`[ng-ability] ${msg}`, ...args),
    error: (msg, ...args) => logger.error(`[ng-ability] ${msg}`, ...args),
  };
}

export const throwAbilityMissingHandler = (matcher: unknown): never => {
  throw new AbilityMissingError(matcher);
};

export const warnAbilityMissingHandler = (
  matcher: unknown,
  action: string,
): void => {
  console.warn(
    `[ng-ability] No registered ability found for matcher`,
    matcher,
    `(action: "${action}")`,
  );
};

@Injectable({ providedIn: 'root' })
export class NgAbilityService {
  private readonly context = inject(ABILITY_CONTEXT);
  private readonly abilities = inject(ABILITY);
  private readonly logger = prefixedLogger(inject(ABILITY_LOGGER));
  private readonly missingHandler = inject(ABILITY_MISSING_HANDLER);

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

    this.logger.debug('Checking ability', {
      matcher: matcherOrThing,
      action,
      thing,
      context: currentContext,
    });

    // Check all global abilities first - all must return true
    for (const ability of this.abilities) {
      if (isGlobalAbility(ability.constructor)) {
        if (!ability.can(currentContext, action, thing)) {
          this.logger.debug('Global ability denied', {
            ability: ability.constructor.name,
            action,
            thing,
          });

          return false;
        }
      }
    }

    // If all global abilities passed (or there are none), check specific ability
    const result = Boolean(
      this.getAbility(matcherOrThing, action, thing).can(
        currentContext,
        action,
        thing,
      ),
    );

    this.logger.debug('Ability check result', {
      matcher: matcherOrThing,
      action,
      thing,
      result,
    });

    return result;
  }

  private getAbility(
    matcher: unknown,
    action: string,
    thing?: unknown,
  ): Ability<unknown, unknown> {
    const ability = this.abilities
      .filter((ability) => !isGlobalAbility(ability.constructor))
      .find((ability) => {
        const matchers = getAbilityMatchers(ability.constructor);

        if (!Array.isArray(matchers) || matchers.length === 0) {
          this.logger.error(
            'Unable to match ability without matcher',
            ability,
          );

          return false;
        }

        return matchers.some((m) => this.matchAbility(m, matcher));
      });

    if (ability == null) {
      this.logger.debug('No ability found for matcher', matcher);
      this.missingHandler(matcher, action, thing);
      return inability;
    }

    this.logger.debug('Ability resolved', {
      ability: ability.constructor.name,
    });

    return ability;
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
