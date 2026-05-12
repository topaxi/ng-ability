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
  throwAbilityUnauthorizedHandler,
  cancelAbilityUnauthorizedHandler,
  redirectAbilityUnauthorizedHandler,
  type AbilityThingResolver,
} from './lib/ability.guard';
export {
  NgAbilityError,
  AbilityGuardUnauthorizedError,
  AbilityMissingError,
} from './lib/errors';
export {
  NgAbilityModule,
  provideAbilities,
  type ProvideAbilitiesOptions,
} from './lib/ng-ability.module';
export {
  ABILITY_UNAUTHORIZED_HANDLER,
  type AbilityGuardUnauthorizedHandler,
  ABILITY_MISSING_HANDLER,
  type AbilityMissingHandler,
  ABILITY_LOGGER,
  type AbilityLogger,
} from './lib/ng-ability.tokens';
export {
  throwAbilityMissingHandler,
  warnAbilityMissingHandler,
} from './lib/ng-ability.service';
