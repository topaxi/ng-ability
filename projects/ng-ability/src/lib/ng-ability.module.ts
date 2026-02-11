import { EnvironmentProviders, makeEnvironmentProviders, NgModule } from '@angular/core';
import { Ability, AbilityContext } from './interfaces';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.service';
import { CanDirective } from './can.directive';
import { CanPipe } from './can.pipe';

export function provideAbilities(
  contextClass: { new (...args: unknown[]): AbilityContext<unknown> },
  abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ABILITY_CONTEXT, useClass: contextClass },
    ...abilities.map(a => ({ provide: ABILITY, useClass: a, multi: true })),
  ]);
}

@NgModule({
  imports: [CanDirective, CanPipe],
  exports: [CanDirective, CanPipe],
})
export class NgAbilityModule {
  static withAbilities(
    contextClass: { new (...args: unknown[]): AbilityContext<unknown> },
    abilities: { new (...args: unknown[]): Ability<unknown, unknown> }[]
  ) {
    return {
      ngModule: NgAbilityModule,
      providers: [
        { provide: ABILITY_CONTEXT, useClass: contextClass },
        ...abilities.map(a => ({ provide: ABILITY, useClass: a, multi: true })),
      ],
    };
  }
}
