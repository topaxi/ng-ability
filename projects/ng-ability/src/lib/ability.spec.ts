import { AbilityFor, getAbilityMatchers } from './ability';

describe('AbilityFor', () => {
  let Model: any;

  beforeEach(() => {
    Model = class Model {};
  });

  it('should define abilityMatchers on class', () => {
    @AbilityFor(Model, 'Model')
    class Test {}

    expect(getAbilityMatchers(Test)).toEqual([Model, 'Model']);
  });
});
