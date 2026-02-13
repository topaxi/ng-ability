import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  Route,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';

import { AbilityFor } from './ability';
import {
  canActivateAbility,
  canActivateChildAbility,
  canMatchAbility,
} from './ability.guard';
import type { Ability } from './interfaces';
import { ABILITY, ABILITY_CONTEXT } from './ng-ability.tokens';

declare module './interfaces' {
  interface AbilityActions {
    Document: 'view' | 'edit' | 'delete';
    Blog: 'read' | 'write';
  }
}

describe('canActivateAbility', () => {
  let documentAbility: Ability<any, any>;
  let blogAbility: Ability<any, any>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    @AbilityFor('Document')
    class DocumentAbility {
      can = vi.fn().mockReturnValue(true);
    }
    documentAbility = new DocumentAbility();

    @AbilityFor('Blog')
    class BlogAbility {
      can = vi.fn().mockReturnValue(true);
    }
    blogAbility = new BlogAbility();

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => documentAbility, multi: true },
        { provide: ABILITY, useFactory: () => blogAbility, multi: true },
      ],
    });
  });

  it('should allow activation when ability check passes', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const guard = canActivateAbility('Document', 'view');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'view', 'Document');
  });

  it('should prevent activation when ability check fails', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const guard = canActivateAbility('Document', 'edit');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'edit', 'Document');
  });

  it('should work with different matchers and actions', () => {
    (blogAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const guard = canActivateAbility('Blog', 'write');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(blogAbility.can).toHaveBeenCalledWith(null, 'write', 'Blog');
  });

  it('should work with class-based matchers', () => {
    class Item {}

    @AbilityFor(Item)
    class ItemAbility {
      can = vi.fn().mockReturnValue(true);
    }
    const itemAbility = new ItemAbility();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => itemAbility, multi: true },
      ],
    });

    const guard = canActivateAbility(Item, 'read');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(itemAbility.can).toHaveBeenCalledWith(null, 'read', Item);
  });

  it('should use the ability context if provided', () => {
    interface User {
      id: string;
      role: string;
    }

    const currentUser: User = { id: '1', role: 'admin' };
    const userSignal = signal<User | null>(currentUser);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ABILITY_CONTEXT,
          useValue: { abilityContext: userSignal },
        },
        { provide: ABILITY, useFactory: () => documentAbility, multi: true },
      ],
    });

    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const guard = canActivateAbility('Document', 'delete');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(documentAbility.can).toHaveBeenCalledWith(
      currentUser,
      'delete',
      'Document',
    );
  });

  it('should create independent guards for different abilities', () => {
    const guardView = canActivateAbility('Document', 'view');
    const guardEdit = canActivateAbility('Document', 'edit');

    (documentAbility.can as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(true) // view
      .mockReturnValueOnce(false); // edit

    const resultView = TestBed.runInInjectionContext(() =>
      guardView(mockRoute, mockState),
    );
    const resultEdit = TestBed.runInInjectionContext(() =>
      guardEdit(mockRoute, mockState),
    );

    expect(resultView).toBe(true);
    expect(resultEdit).toBe(false);
    expect(documentAbility.can).toHaveBeenCalledTimes(2);
  });

  it('should use thing resolver when provided', () => {
    class DocumentModel {}
    const mockDocument = new DocumentModel();
    mockRoute = { data: { document: mockDocument } } as any;

    @AbilityFor(DocumentModel)
    class DocumentModelAbility {
      can = vi.fn().mockReturnValue(true);
    }
    const docModelAbility = new DocumentModelAbility();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => docModelAbility, multi: true },
      ],
    });

    const guard = canActivateAbility(
      DocumentModel,
      'edit',
      (route) => (route as ActivatedRouteSnapshot).data['document'],
    );
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(docModelAbility.can).toHaveBeenCalledWith(
      null,
      'edit',
      mockDocument,
    );
  });

  it('should pass route and state to thing resolver', () => {
    const thingResolver = vi.fn().mockReturnValue('resolved-thing');

    const guard = canActivateAbility('Document', 'view', thingResolver);
    TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

    expect(thingResolver).toHaveBeenCalledWith(mockRoute, mockState);
  });
});

describe('canActivateChildAbility', () => {
  let documentAbility: Ability<any, any>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    @AbilityFor('Document')
    class DocumentAbility {
      can = vi.fn().mockReturnValue(true);
    }
    documentAbility = new DocumentAbility();

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => documentAbility, multi: true },
      ],
    });
  });

  it('should allow child activation when ability check passes', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const guard = canActivateChildAbility('Document', 'view');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'view', 'Document');
  });

  it('should prevent child activation when ability check fails', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const guard = canActivateChildAbility('Document', 'edit');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'edit', 'Document');
  });

  it('should use thing resolver when provided', () => {
    class DocumentModel {}
    const mockDocument = new DocumentModel();
    mockRoute = { data: { document: mockDocument } } as any;

    @AbilityFor(DocumentModel)
    class DocumentModelAbility {
      can = vi.fn().mockReturnValue(true);
    }
    const docModelAbility = new DocumentModelAbility();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => docModelAbility, multi: true },
      ],
    });

    const guard = canActivateChildAbility(
      DocumentModel,
      'view',
      (route) => (route as ActivatedRouteSnapshot).data['document'],
    );
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(docModelAbility.can).toHaveBeenCalledWith(
      null,
      'view',
      mockDocument,
    );
  });
});

describe('canMatchAbility', () => {
  let documentAbility: Ability<any, any>;
  let mockRoute: Route;
  let mockSegments: UrlSegment[];

  beforeEach(() => {
    @AbilityFor('Document')
    class DocumentAbility {
      can = vi.fn().mockReturnValue(true);
    }
    documentAbility = new DocumentAbility();

    mockRoute = {} as Route;
    mockSegments = [] as UrlSegment[];

    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => documentAbility, multi: true },
      ],
    });
  });

  it('should allow route match when ability check passes', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const guard = canMatchAbility('Document', 'view');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockSegments),
    );

    expect(result).toBe(true);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'view', 'Document');
  });

  it('should prevent route match when ability check fails', () => {
    (documentAbility.can as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const guard = canMatchAbility('Document', 'edit');
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockSegments),
    );

    expect(result).toBe(false);
    expect(documentAbility.can).toHaveBeenCalledWith(null, 'edit', 'Document');
  });

  it('should use thing resolver when provided', () => {
    class DocumentModel {}
    const mockDocument = new DocumentModel();
    mockRoute = { data: { document: mockDocument } } as any;

    @AbilityFor(DocumentModel)
    class DocumentModelAbility {
      can = vi.fn().mockReturnValue(true);
    }
    const docModelAbility = new DocumentModelAbility();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useFactory: () => docModelAbility, multi: true },
      ],
    });

    const guard = canMatchAbility(
      DocumentModel,
      'view',
      (route: any) => route.data['document'],
    );
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockSegments),
    );

    expect(result).toBe(true);
    expect(docModelAbility.can).toHaveBeenCalledWith(
      null,
      'view',
      mockDocument,
    );
  });
});

describe('canActivateAbility type tests', () => {
  it('should accept registered string matchers with declared actions', () => {
    expectTypeOf(canActivateAbility).toBeCallableWith('Document', 'view');
    expectTypeOf(canActivateAbility).toBeCallableWith('Document', 'edit');
    expectTypeOf(canActivateAbility).toBeCallableWith('Document', 'delete');
    expectTypeOf(canActivateAbility).toBeCallableWith('Blog', 'read');
    expectTypeOf(canActivateAbility).toBeCallableWith('Blog', 'write');
  });

  it('should accept unregistered string matchers with any action', () => {
    expectTypeOf(canActivateAbility).toBeCallableWith('Custom', 'any-action');
    expectTypeOf(canActivateAbility).toBeCallableWith('Unknown', 'anything');
  });

  it('should accept class-based matchers', () => {
    class Model {}
    expectTypeOf(canActivateAbility).toBeCallableWith(Model, 'read');
    expectTypeOf(canActivateAbility).toBeCallableWith(Model, 'custom-action');
  });

  it('should return CanActivateFn', () => {
    const guard = canActivateAbility('Document', 'view');
    expectTypeOf(guard).toBeFunction();
    expectTypeOf(guard).parameters.toEqualTypeOf<
      [ActivatedRouteSnapshot, RouterStateSnapshot]
    >();
  });
});
