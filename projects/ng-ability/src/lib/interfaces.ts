import type { Signal } from '@angular/core';

/**
 * Special symbol to mark an ability as global.
 * Global abilities are checked first before any specific abilities,
 * and all global abilities must return true for permission checks to proceed.
 *
 * @example
 * ```typescript
 * @AbilityFor(GlobalAbility)
 * export class ReadOnlyAbility implements Ability<User> {
 *   can(currentUser: User | null, action: string) {
 *     if (currentUser?.readOnly && action !== 'read') {
 *       return false;
 *     }
 *     return true;
 *   }
 * }
 * ```
 */
export const GlobalAbility = Symbol('GlobalAbility');

export type AbilityMatcher<T> = { new (): T } | ((t: T) => boolean) | string;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AbilityActions {}

declare const abilityActionsKey: unique symbol;

export interface AbilityActionsOf<K extends keyof AbilityActions> {
  readonly [abilityActionsKey]?: K;
}

export type AbilityAction =
  | AbilityActions[keyof AbilityActions]
  | (string & {});

export type AbilityActionFor<M> = M extends keyof AbilityActions
  ? AbilityActions[M]
  : AbilityAction;

export interface Ability<S, O = never> {
  can(subj: S | null, action: AbilityAction, obj?: O): boolean;
}

export interface AbilityContext<S> {
  readonly abilityContext: Signal<S>;
}
