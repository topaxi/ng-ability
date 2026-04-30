import { InjectionToken, signal } from '@angular/core';
import type {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  RouterStateSnapshot,
} from '@angular/router';
import { type Ability, type AbilityContext } from './interfaces';
import { AbilityGuardUnauthorizedError } from './ability.guard.error';

const nullContext: AbilityContext<null> = { abilityContext: signal(null) };

export const ABILITY_CONTEXT = new InjectionToken<AbilityContext<unknown>>(
  'AbilityContext',
  { factory: () => nullContext },
);
export const ABILITY = new InjectionToken<
  ReadonlyArray<Ability<unknown, unknown>>
>('Ability', { factory: () => [] });

export type AbilityGuardUnauthorizedHandler = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => MaybeAsync<GuardResult>;

export const ABILITY_UNAUTHORIZED_HANDLER =
  new InjectionToken<AbilityGuardUnauthorizedHandler>(
    'AbilityUnauthorizedHandler',
    {
      factory: () => () => {
        throw new AbilityGuardUnauthorizedError();
      },
    },
  );
