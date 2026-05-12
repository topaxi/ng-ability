import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  NgModule,
  Provider,
} from '@angular/core';
import { Ability, AbilityContext } from './interfaces';
import {
  ABILITY,
  ABILITY_CONTEXT,
  ABILITY_LOGGER,
  ABILITY_MISSING_HANDLER,
  ABILITY_UNAUTHORIZED_HANDLER,
  type AbilityLogger,
  type AbilityMissingHandler,
  type AbilityGuardUnauthorizedHandler,
} from './ng-ability.tokens';
import { CanDirective } from './can.directive';
import { CanPipe } from './can.pipe';

type AbilityClass = { new (...args: unknown[]): Ability<unknown, unknown> };
type ContextClass = { new (...args: unknown[]): AbilityContext<unknown> };

function abilityToProvider(ability: AbilityClass): Provider {
  return { provide: ABILITY, useClass: ability, multi: true };
}

export interface ProvideAbilitiesOptions {
  context?: ContextClass;
  abilities: AbilityClass[];
  unauthorizedHandler?: AbilityGuardUnauthorizedHandler;
  missingHandler?: AbilityMissingHandler;
  logger?: AbilityLogger;
}

export function provideAbilities(
  abilities: AbilityClass[],
): EnvironmentProviders;
export function provideAbilities(
  contextClass: ContextClass,
  abilities: AbilityClass[],
): EnvironmentProviders;
export function provideAbilities(
  options: ProvideAbilitiesOptions,
): EnvironmentProviders;
export function provideAbilities(
  contextClassOrAbilitiesOrOptions: ContextClass | AbilityClass[] | ProvideAbilitiesOptions,
  abilities?: AbilityClass[],
): EnvironmentProviders {
  if (Array.isArray(contextClassOrAbilitiesOrOptions)) {
    return makeEnvironmentProviders(
      contextClassOrAbilitiesOrOptions.map(abilityToProvider),
    );
  }

  if (isProvideAbilitiesOptions(contextClassOrAbilitiesOrOptions)) {
    const { context, abilities, unauthorizedHandler, missingHandler, logger } =
      contextClassOrAbilitiesOrOptions;
    const providers: Provider[] = abilities.map(abilityToProvider);
    if (context) {
      providers.push({ provide: ABILITY_CONTEXT, useClass: context });
    }
    if (unauthorizedHandler) {
      providers.push({
        provide: ABILITY_UNAUTHORIZED_HANDLER,
        useValue: unauthorizedHandler,
      });
    }
    if (missingHandler) {
      providers.push({
        provide: ABILITY_MISSING_HANDLER,
        useValue: missingHandler,
      });
    }
    if (logger) {
      providers.push({ provide: ABILITY_LOGGER, useValue: logger });
    }
    return makeEnvironmentProviders(providers);
  }

  return makeEnvironmentProviders([
    { provide: ABILITY_CONTEXT, useClass: contextClassOrAbilitiesOrOptions },
    ...abilities!.map(abilityToProvider),
  ]);
}

function isProvideAbilitiesOptions(
  value: unknown,
): value is ProvideAbilitiesOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    'abilities' in value &&
    Array.isArray((value as ProvideAbilitiesOptions).abilities)
  );
}

/**
 * @deprecated Use `provideAbilities()` for configuration and import `CanDirective`/`CanPipe` directly in your components.
 */
@NgModule({
  imports: [CanDirective, CanPipe],
  exports: [CanDirective, CanPipe],
})
export class NgAbilityModule {
  static withAbilities(
    abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[],
  ): { ngModule: typeof NgAbilityModule; providers: any[] };
  static withAbilities(
    contextClass: { new (...args: unknown[]): AbilityContext<unknown> },
    abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[],
  ): { ngModule: typeof NgAbilityModule; providers: any[] };
  static withAbilities(
    contextClassOrAbilities:
      | { new (...args: unknown[]): AbilityContext<unknown> }
      | { new (...args: unknown[]): Ability<unknown, unknown> }[],
    abilities?: { new (...args: unknown[]): Ability<unknown, unknown> }[],
  ) {
    if (Array.isArray(contextClassOrAbilities)) {
      return {
        ngModule: NgAbilityModule,
        providers: contextClassOrAbilities.map(abilityToProvider),
      };
    }

    return {
      ngModule: NgAbilityModule,
      providers: [
        { provide: ABILITY_CONTEXT, useClass: contextClassOrAbilities },
        ...abilities!.map(abilityToProvider),
      ],
    };
  }
}
