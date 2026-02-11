import { EnvironmentProviders, makeEnvironmentProviders, NgModule } from '@angular/core';
import { Ability, AbilityContext } from './interfaces';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.service';
import { CanDirective } from './can.directive';

export function provideAbilities(
  contextClass: { new (...args: any[]): AbilityContext<any> },
  abilities: { new (...args: any[]): Ability<any, any> }[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ABILITY_CONTEXT, useClass: contextClass },
    ...abilities.map(a => ({ provide: ABILITY, useClass: a, multi: true })),
  ]);
}

@NgModule({
  imports: [CanDirective],
  exports: [CanDirective],
})
export class NgAbilityModule {
  static withAbilities(
    contextClass: { new (...args: any[]): AbilityContext<any> },
    abilities: { new (...args: any[]): Ability<any, any> }[]
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
