/*
 * Public API Surface of ng-ability
 */

export { AbilityFor } from './lib/ability';
export * from './lib/interfaces';
export * from './lib/ng-ability.service';
export * from './lib/ng-ability.tokens';
export * from './lib/can.directive';
export * from './lib/can.pipe';
export {
  canActivateAbility,
  canActivateChildAbility,
  canMatchAbility,
  type AbilityThingResolver,
} from './lib/ability.guard';
export { NgAbilityModule, provideAbilities } from './lib/ng-ability.module';
