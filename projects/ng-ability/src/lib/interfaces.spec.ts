import type { AbilityActions, AbilityActionsOf, Action } from './interfaces';
import type { NgAbilityService } from './ng-ability.service';

declare module './interfaces' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit';
    AdminArea: 'view';
  }
}

describe('AbilityActions declaration merging', () => {
  it('should include merged matcher keys', () => {
    expectTypeOf<keyof AbilityActions>().toEqualTypeOf<
      'Article' | 'AdminArea'
    >();
  });

  it('should map matcher to its declared actions', () => {
    expectTypeOf<AbilityActions['Article']>().toEqualTypeOf<
      'view' | 'create' | 'edit'
    >();
    expectTypeOf<AbilityActions['AdminArea']>().toEqualTypeOf<'view'>();
  });

  it('should include all declared actions in the Action type', () => {
    expectTypeOf<'view'>().toExtend<Action>();
    expectTypeOf<'create'>().toExtend<Action>();
    expectTypeOf<'edit'>().toExtend<Action>();
  });

  it('should still accept arbitrary strings as Action', () => {
    expectTypeOf<'arbitrary'>().toExtend<Action>();
  });
});

describe('NgAbilityService.can() type overloads', () => {
  it('should accept registered matcher with its declared actions', () => {
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith('Article', 'view');
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      'Article',
      'create',
    );
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      'AdminArea',
      'view',
    );
  });

  it('should accept registered matcher with arbitrary action strings', () => {
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      'Article',
      'arbitrary',
    );
  });

  it('should accept unregistered matcher with any action', () => {
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      'Unknown',
      'anything',
    );
  });

  it('should accept class-based matchers', () => {
    class Model {}

    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      Model,
      'edit',
      new Model(),
    );
  });

  it('should narrow actions for class-based matchers using AbilityActionsOf', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}

    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      ArticleModel,
      'view',
    );
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      ArticleModel,
      'create',
    );
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      ArticleModel,
      'edit',
    );
    expectTypeOf<NgAbilityService['can']>().toBeCallableWith(
      ArticleModel,
      'arbitrary',
    );
  });
});
