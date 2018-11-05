import { NgModule } from '@angular/core';
import { AbilityContext, Ability } from './interfaces';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.service';
import { CanDirective } from './can.directive';

export function abilityToProvider(abilityClass) {
  return {
    provide: ABILITY,
    useClass: abilityClass,
    multi: true
  };
}

@NgModule({
  declarations: [CanDirective],
  exports: [CanDirective]
})
export class NgAbilityModule {
  static withAbilities(
    contextClass: { new (): AbilityContext<any> },
    abilities: { new (): Ability<any, any> }[]
  ) {
    return {
      ngModule: NgAbilityModule,
      providers: abilities
        .map(abilityToProvider)
        .concat({ provide: ABILITY_CONTEXT, useClass: contextClass } as any)
    };
  }
}
