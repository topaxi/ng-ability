export type AbilityMatcher<T> = { new (): T } | ((t: T) => boolean) | string;

export interface Ability<S, O = never> {
  can(subj: S | null, action: string, obj?: O): boolean;
}

export interface AbilityContext<S> {
  getAbilityContext(): S;
}
