export class NgAbilityError extends Error {
  override name = 'NgAbilityError';
}

export class AbilityGuardUnauthorizedError extends NgAbilityError {
  override name = 'AbilityGuardUnauthorizedError';

  constructor() {
    super('Navigation was blocked because the current user lacks the required ability.');
  }
}
