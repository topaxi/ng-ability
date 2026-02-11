import type { Signal } from '@angular/core';

export type AbilityMatcher<T> = { new (): T } | ((t: T) => boolean) | string;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AbilityActions {}

export type Action = AbilityActions[keyof AbilityActions] | (string & {});

export interface Ability<S, O = never> {
  can(subj: S | null, action: Action, obj?: O): boolean;
}

export interface AbilityContext<S> {
  readonly abilityContext: Signal<S>;
}
