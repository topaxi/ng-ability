import { TestBed } from '@angular/core/testing';

import { AbilityFor } from './ability';
import { Ability, AbilityMatcher } from './interfaces';
import {
  NgAbilityService,
  ABILITY,
  ABILITY_CONTEXT,
} from './ng-ability.service';

describe('NgAbilityService', () => {
  function ability<T>(...matchers: AbilityMatcher<T>[]): Ability<any, T> {
    @AbilityFor(...matchers)
    class DummyAbility {
      can = vi.fn();
    }
    return new DummyAbility();
  }

  describe('default', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      expect(service.can('something', 'edit')).toBe(false);
    });
  });

  describe('without context', () => {
    let dummyAbility: Ability<any, any>;

    beforeEach(() => {
      dummyAbility = ability('Dummy');

      TestBed.configureTestingModule({
        providers: [
          { provide: ABILITY, useFactory: () => dummyAbility, multi: true },
        ],
      });
    });

    it('should call ability with null context', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create');
      expect(dummyAbility.can).toHaveBeenCalledWith(null, 'create', 'Dummy');
    });

    it('should be able to override value', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create', 'value');
      expect(dummyAbility.can).toHaveBeenCalledWith(null, 'create', 'value');
    });
  });

  describe('with context', () => {
    let dummyAbility: Ability<any, any>;
    let context: any;

    beforeEach(() => {
      context = { id: '42' };
      dummyAbility = ability('Dummy');

      TestBed.configureTestingModule({
        providers: [
          {
            provide: ABILITY_CONTEXT,
            useValue: { getAbilityContext: () => context },
          },
          { provide: ABILITY, useFactory: () => dummyAbility, multi: true },
        ],
      });
    });

    it('should call ability with provided context', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create');
      expect(dummyAbility.can).toHaveBeenCalledWith(
        context,
        'create',
        'Dummy'
      );
    });

    it('should be able to override value', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create', 'value');
      expect(dummyAbility.can).toHaveBeenCalledWith(
        context,
        'create',
        'value'
      );
    });
  });

  describe('ability resolution', () => {
    let stringAbility: Ability<any, any>;
    let typeAbility: Ability<any, any>;
    let fnAbility: Ability<any, any>;
    let mixedFnMatcher: (obj: any) => boolean;
    let mixedAbility: Ability<any, any>;

    class Model {}
    class Mixed {
      readonly __typename = 'Mixed';
    }

    beforeEach(() => {
      stringAbility = ability('MyString');
      typeAbility = ability(Model);
      fnAbility = ability(obj => obj.__typename === 'MyObject');
      mixedFnMatcher = vi.fn((obj: any) => obj.__typename === 'Mixed');
      mixedAbility = ability('Mixed', Mixed, mixedFnMatcher);

      TestBed.configureTestingModule({
        providers: [
          { provide: ABILITY, useFactory: () => stringAbility, multi: true },
          { provide: ABILITY, useFactory: () => typeAbility, multi: true },
          { provide: ABILITY, useFactory: () => fnAbility, multi: true },
          { provide: ABILITY, useFactory: () => mixedAbility, multi: true },
        ],
      });
    });

    it('should resolve string based abilities', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('MyString', 'create');
      expect(stringAbility.can).toHaveBeenCalledWith(
        null,
        'create',
        'MyString'
      );
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).not.toHaveBeenCalled();
    });

    it('should resolve type based abilities', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can(Model, 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).toHaveBeenCalledWith(null, 'create', Model);
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).not.toHaveBeenCalled();
    });

    it('should resolve type based abilities with instances', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      const user = new Model();
      service.can(user, 'edit');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).toHaveBeenCalledWith(null, 'edit', user);
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).not.toHaveBeenCalled();
    });

    it('should resolve function based abilities', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      const myObject = { __typename: 'MyObject' };
      service.can(myObject, 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).toHaveBeenCalledWith(null, 'create', myObject);
      expect(mixedAbility.can).not.toHaveBeenCalled();
    });

    it('should resolve abilities with multiple matchers', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);

      service.can('Mixed', 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).toHaveBeenCalledWith(null, 'create', 'Mixed');
      expect(mixedFnMatcher).not.toHaveBeenCalled();

      service.can(Mixed, 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).toHaveBeenCalledWith(null, 'create', Mixed);
      expect(mixedFnMatcher).not.toHaveBeenCalled();

      const instance = new Mixed();
      service.can(instance, 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).toHaveBeenCalledWith(null, 'create', instance);
      expect(mixedFnMatcher).not.toHaveBeenCalled();

      const obj = { __typename: 'Mixed' };
      service.can(obj, 'create');
      expect(stringAbility.can).not.toHaveBeenCalled();
      expect(typeAbility.can).not.toHaveBeenCalled();
      expect(fnAbility.can).not.toHaveBeenCalled();
      expect(mixedAbility.can).toHaveBeenCalledWith(null, 'create', obj);
      expect(mixedFnMatcher).toHaveBeenCalledWith(obj);
    });
  });
});
