import type { Signal } from '@angular/core';

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
