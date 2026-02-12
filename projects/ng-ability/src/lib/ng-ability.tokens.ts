import { InjectionToken, signal } from '@angular/core';
import { type Ability, type AbilityContext } from './interfaces';

const nullContext: AbilityContext<null> = { abilityContext: signal(null) };

export const ABILITY_CONTEXT = new InjectionToken<AbilityContext<unknown>>(
  'AbilityContext',
  { factory: () => nullContext },
);
export const ABILITY = new InjectionToken<
  ReadonlyArray<Ability<unknown, unknown>>
>('Ability', { factory: () => [] });
