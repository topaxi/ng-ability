import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AbilityFor } from './ability';
import type {
  Ability,
  AbilityActions,
  AbilityActionsOf,
  AbilityMatcher,
  AbilityAction,
  ActionFor,
} from './interfaces';
import {
  NgAbilityService,
  ABILITY,
  ABILITY_CONTEXT,
} from './ng-ability.service';

declare module './interfaces' {
  interface AbilityActions {
    Post: 'read' | 'write' | 'delete';
    Comment: 'read' | 'moderate';
    Settings: 'view';
  }
}

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
    let contextSignal: WritableSignal<any>;

    beforeEach(() => {
      context = { id: '42' };
      contextSignal = signal(context);
      dummyAbility = ability('Dummy');

      TestBed.configureTestingModule({
        providers: [
          {
            provide: ABILITY_CONTEXT,
            useValue: { abilityContext: contextSignal },
          },
          { provide: ABILITY, useFactory: () => dummyAbility, multi: true },
        ],
      });
    });

    it('should call ability with provided context', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create');
      expect(dummyAbility.can).toHaveBeenCalledWith(context, 'create', 'Dummy');
    });

    it('should be able to override value', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create', 'value');
      expect(dummyAbility.can).toHaveBeenCalledWith(context, 'create', 'value');
    });

    it('should pass updated context when abilityContext signal changes', () => {
      const service: NgAbilityService = TestBed.inject(NgAbilityService);
      service.can('Dummy', 'create');
      expect(dummyAbility.can).toHaveBeenCalledWith(
        { id: '42' },
        'create',
        'Dummy',
      );

      const newContext = { id: '99' };
      contextSignal.set(newContext);

      service.can('Dummy', 'edit');
      expect(dummyAbility.can).toHaveBeenCalledWith(
        newContext,
        'edit',
        'Dummy',
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
      fnAbility = ability((obj) => obj.__typename === 'MyObject');
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
        'MyString',
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

describe('NgAbilityService type tests', () => {
  describe('AbilityActions declaration merging', () => {
    it('should include merged matcher keys', () => {
      expectTypeOf<'Post' | 'Comment' | 'Settings'>().toMatchTypeOf<
        keyof AbilityActions
      >();
    });

    it('should map matcher to its declared actions', () => {
      expectTypeOf<AbilityActions['Post']>().toEqualTypeOf<
        'read' | 'write' | 'delete'
      >();
      expectTypeOf<AbilityActions['Comment']>().toEqualTypeOf<
        'read' | 'moderate'
      >();
      expectTypeOf<AbilityActions['Settings']>().toEqualTypeOf<'view'>();
    });

    it('should include all declared actions in the Action type', () => {
      expectTypeOf<'read'>().toExtend<AbilityAction>();
      expectTypeOf<'write'>().toExtend<AbilityAction>();
      expectTypeOf<'delete'>().toExtend<AbilityAction>();
      expectTypeOf<'moderate'>().toExtend<AbilityAction>();
      expectTypeOf<'view'>().toExtend<AbilityAction>();
    });

    it('should still accept arbitrary strings as Action', () => {
      expectTypeOf<'custom-action'>().toExtend<AbilityAction>();
      expectTypeOf<'any-string'>().toExtend<AbilityAction>();
    });
  });

  describe('ActionFor conditional type', () => {
    it('should narrow ActionFor for known matchers', () => {
      expectTypeOf<ActionFor<'Post'>>().toEqualTypeOf<
        'read' | 'write' | 'delete'
      >();
      expectTypeOf<ActionFor<'Comment'>>().toEqualTypeOf<'read' | 'moderate'>();
      expectTypeOf<ActionFor<'Settings'>>().toEqualTypeOf<'view'>();
    });

    it('should return Action for unknown matchers', () => {
      expectTypeOf<ActionFor<'Unknown'>>().toEqualTypeOf<AbilityAction>();
      expectTypeOf<ActionFor<'AnyOther'>>().toEqualTypeOf<AbilityAction>();
    });

    it('should return Action for non-string types', () => {
      expectTypeOf<ActionFor<object>>().toEqualTypeOf<AbilityAction>();
      expectTypeOf<ActionFor<number>>().toEqualTypeOf<AbilityAction>();
    });
  });

  describe('can() method overloads', () => {
    it('should accept registered string matchers with their declared actions', () => {
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith('Post', 'read');
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith('Post', 'write');
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Post',
        'delete',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Comment',
        'read',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Comment',
        'moderate',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Settings',
        'view',
      );
    });

    it('should accept registered matchers with optional thing parameter', () => {
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith('Post', 'read', {
        id: 1,
      });
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Comment',
        'moderate',
        null,
      );
    });

    it('should accept unregistered string matchers with any action', () => {
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Unknown',
        'anything',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'Custom',
        'custom-action',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        'AnyMatcher',
        'any-action',
      );
    });

    it('should accept class-based matchers with any action', () => {
      class UserModel {}
      class DocumentModel {}

      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        UserModel,
        'create',
        new UserModel(),
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        DocumentModel,
        'archive',
        new DocumentModel(),
      );
    });

    it('should accept class-based matchers without thing parameter', () => {
      class GenericModel {}

      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        GenericModel,
        'list',
      );
    });

    it('should narrow actions for class-based matchers using AbilityActionsOf', () => {
      class PostModel implements AbilityActionsOf<'Post'> {}
      class CommentModel implements AbilityActionsOf<'Comment'> {}

      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        PostModel,
        'read',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        PostModel,
        'write',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        PostModel,
        'delete',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        CommentModel,
        'read',
      );
      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        CommentModel,
        'moderate',
      );
    });

    it('should accept AbilityActionsOf classes with thing parameter', () => {
      class PostModel implements AbilityActionsOf<'Post'> {}

      expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
        PostModel,
        'read',
        new PostModel(),
      );
    });

    it('should return boolean from can()', () => {
      expectTypeOf<NgAbilityService['can']>().returns.toEqualTypeOf<boolean>();
    });
  });

  describe('AbilityActionsOf marker interface', () => {
    it('should allow implementing AbilityActionsOf for registered matchers', () => {
      class PostEntity implements AbilityActionsOf<'Post'> {}
      class CommentEntity implements AbilityActionsOf<'Comment'> {}

      expectTypeOf<PostEntity>().toMatchTypeOf<AbilityActionsOf<'Post'>>();
      expectTypeOf<CommentEntity>().toMatchTypeOf<
        AbilityActionsOf<'Comment'>
      >();
    });

    it('should preserve the branded key type', () => {
      type PostKey =
        AbilityActionsOf<'Post'> extends { readonly [K in infer Key]?: 'Post' }
          ? Key
          : never;
      expectTypeOf<PostKey>().toBeSymbol();
    });
  });

  describe('AbilityMatcher type', () => {
    it('should accept string matchers', () => {
      expectTypeOf<'Post'>().toMatchTypeOf<AbilityMatcher<unknown>>();
      expectTypeOf<'Custom'>().toMatchTypeOf<AbilityMatcher<unknown>>();
    });

    it('should accept class constructors', () => {
      class Model {}
      expectTypeOf<typeof Model>().toMatchTypeOf<AbilityMatcher<Model>>();
    });

    it('should accept predicate functions', () => {
      const predicate = (obj: { type: string }) => obj.type === 'post';
      expectTypeOf<typeof predicate>().toMatchTypeOf<
        AbilityMatcher<{ type: string }>
      >();
    });
  });
});
