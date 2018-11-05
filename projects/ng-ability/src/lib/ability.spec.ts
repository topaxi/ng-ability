import 'reflect-metadata';
import { AbilityFor } from './ability';

describe('AbilityFor', () => {
  let Model;

  beforeEach(() => {
    Model = class Model {}; // tslint:disable-line
  });

  it('should define abilityMatchers metadata on class', () => {
    @AbilityFor(Model, 'Model')
    class Test {}

    expect(Reflect.getMetadata('abilityMatchers', Test)).toEqual([
      Model,
      'Model'
    ]);
  });
});
