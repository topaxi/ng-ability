export class NgAbilityError extends Error {
  override name = 'NgAbilityError';
}

export class AbilityGuardUnauthorizedError extends NgAbilityError {
  override name = 'AbilityGuardUnauthorizedError';

  constructor() {
    super('Navigation was blocked because the current user lacks the required ability.');
  }
}

export class AbilityMissingError extends NgAbilityError {
  override name = 'AbilityMissingError';

  constructor(matcher: unknown) {
    super(`No registered ability was found for the given matcher: ${String(matcher)}.`);
  }
}
