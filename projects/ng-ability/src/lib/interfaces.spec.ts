import type {
  AbilityActions,
  AbilityActionsOf,
  AbilityAction,
  AbilityActionFor,
} from './interfaces';
import type { NgAbilityService } from './ng-ability.service';
import type { CanPipe } from './can.pipe';

declare module './interfaces' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit';
    AdminArea: 'view';
  }
}

describe('AbilityActions declaration merging', () => {
  it('should include merged matcher keys', () => {
    expectTypeOf<'Article' | 'AdminArea'>().toExtend<keyof AbilityActions>();
  });

  it('should map matcher to its declared actions', () => {
    expectTypeOf<AbilityActions['Article']>().toEqualTypeOf<
      'view' | 'create' | 'edit'
    >();
    expectTypeOf<AbilityActions['AdminArea']>().toEqualTypeOf<'view'>();
  });

  it('should include all declared actions in the Action type', () => {
    expectTypeOf<'view'>().toExtend<AbilityAction>();
    expectTypeOf<'create'>().toExtend<AbilityAction>();
    expectTypeOf<'edit'>().toExtend<AbilityAction>();
  });

  it('should still accept arbitrary strings as Action', () => {
    expectTypeOf<'arbitrary'>().toExtend<AbilityAction>();
  });

  it('should narrow ActionFor for known matchers', () => {
    expectTypeOf<AbilityActionFor<'Article'>>().toEqualTypeOf<
      'view' | 'create' | 'edit'
    >();
    expectTypeOf<AbilityActionFor<'AdminArea'>>().toEqualTypeOf<'view'>();
  });

  it('should return Action for unknown matchers', () => {
    expectTypeOf<AbilityActionFor<'Unknown'>>().toEqualTypeOf<AbilityAction>();
  });
});

describe('AbilityActionsOf interface', () => {
  it('should be satisfied by empty class (phantom type)', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}

    // Should satisfy the type without requiring any properties
    expectTypeOf<ArticleModel>().toExtend<AbilityActionsOf<'Article'>>();
  });

  it('should allow multiple classes to implement same AbilityActionsOf', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}
    class ArticleDTO implements AbilityActionsOf<'Article'> {}

    expectTypeOf<ArticleModel>().toExtend<AbilityActionsOf<'Article'>>();
    expectTypeOf<ArticleDTO>().toExtend<AbilityActionsOf<'Article'>>();
  });

  it('should support different keys for different classes', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}
    class AdminAreaModel implements AbilityActionsOf<'AdminArea'> {}

    expectTypeOf<ArticleModel>().toExtend<AbilityActionsOf<'Article'>>();
    expectTypeOf<AdminAreaModel>().toExtend<AbilityActionsOf<'AdminArea'>>();
  });

  it('should be compatible with class constructors', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}

    // The class constructor should be usable as a matcher
    expectTypeOf<typeof ArticleModel>().toExtend<
      new () => AbilityActionsOf<'Article'>
    >();
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
  });
});

describe('CanPipe.transform() type overloads', () => {
  it('should accept registered matcher with its declared actions', () => {
    expectTypeOf<CanPipe['transform']>().toBeCallableWith('Article', 'view');
    expectTypeOf<CanPipe['transform']>().toBeCallableWith('Article', 'create');
    expectTypeOf<CanPipe['transform']>().toBeCallableWith('AdminArea', 'view');
  });

  it('should accept unregistered matcher with any action', () => {
    expectTypeOf<CanPipe['transform']>().toBeCallableWith(
      'Unknown',
      'anything',
    );
  });

  it('should accept class-based matchers', () => {
    class Model {}

    expectTypeOf<CanPipe['transform']>().toBeCallableWith(
      Model,
      'edit',
      new Model(),
    );
  });

  it('should narrow actions for class-based matchers using AbilityActionsOf', () => {
    class ArticleModel implements AbilityActionsOf<'Article'> {}

    expectTypeOf<CanPipe['transform']>().toBeCallableWith(ArticleModel, 'view');
    expectTypeOf<CanPipe['transform']>().toBeCallableWith(
      ArticleModel,
      'create',
    );
    expectTypeOf<CanPipe['transform']>().toBeCallableWith(ArticleModel, 'edit');
  });
});
