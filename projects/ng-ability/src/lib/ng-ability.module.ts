import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  NgModule,
  Provider,
} from '@angular/core';
import { Ability, AbilityContext } from './interfaces';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.service';
import { CanDirective } from './can.directive';
import { CanPipe } from './can.pipe';

function abilityToProvider(ability: {
  new (...args: unknown[]): Ability<unknown, unknown>;
}): Provider {
  return { provide: ABILITY, useClass: ability, multi: true };
}

export function provideAbilities(
  abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[],
): EnvironmentProviders;
export function provideAbilities(
  contextClass: { new (...args: unknown[]): AbilityContext<unknown> },
  abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[],
): EnvironmentProviders;
export function provideAbilities(
  contextClassOrAbilities:
    | { new (...args: unknown[]): AbilityContext<unknown> }
    | { new (...args: unknown[]): Ability<unknown, unknown> }[],
  abilities?: { new (...args: unknown[]): Ability<unknown, unknown> }[],
): EnvironmentProviders {
  if (Array.isArray(contextClassOrAbilities)) {
    return makeEnvironmentProviders(
      contextClassOrAbilities.map(abilityToProvider),
    );
  }

  return makeEnvironmentProviders([
    { provide: ABILITY_CONTEXT, useClass: contextClassOrAbilities },
    ...abilities!.map(abilityToProvider),
  ]);
}

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
