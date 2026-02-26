# Testing

This guide covers how to test ng-ability permission logic in your Angular applications. All examples use [Vitest](https://vitest.dev/), but the patterns apply to any test runner.

## Shared Setup

The examples on this page share a small domain model:

```typescript
interface User {
  id: string
  role: 'admin' | 'editor' | 'viewer'
  readOnly?: boolean
}

class Article {
  constructor(
    public id: number,
    public title: string,
    public authorId: string,
  ) {}
}

@AbilityFor(Article, 'Article')
class ArticleAbility implements Ability<User, Article> {
  can(user: User | null, action: string, article?: Article): boolean {
    if (user?.role === 'admin') return true

    switch (action) {
      case 'view':   return true
      case 'create': return user != null
      case 'edit':   return user?.id === article?.authorId
      default:       return false
    }
  }
}
```

## Unit Testing Ability Classes

Ability classes are plain objects — no `TestBed` required. Instantiate them directly and call `can()`:

```typescript
import { describe, it, expect } from 'vitest'

describe('ArticleAbility', () => {
  const ability = new ArticleAbility()
  const article = new Article(1, 'Hello', 'user-1')

  it('allows anyone to view', () => {
    expect(ability.can(null, 'view')).toBe(true)
  })

  it('requires login to create', () => {
    expect(ability.can(null, 'create')).toBe(false)
    expect(ability.can({ id: 'u1', role: 'viewer' }, 'create')).toBe(true)
  })

  it('allows only the author to edit', () => {
    const author: User = { id: 'user-1', role: 'viewer' }
    const other: User  = { id: 'user-2', role: 'viewer' }

    expect(ability.can(author, 'edit', article)).toBe(true)
    expect(ability.can(other, 'edit', article)).toBe(false)
  })

  it('grants admins full access', () => {
    const admin: User = { id: 'a', role: 'admin' }
    expect(ability.can(admin, 'edit', article)).toBe(true)
    expect(ability.can(admin, 'delete', article)).toBe(true)
  })
})
```

### Covering multiple cases with `it.each`

```typescript
it.each([
  { action: 'view',   expected: true },
  { action: 'create', expected: true },
  { action: 'edit',   expected: true },
  { action: 'delete', expected: true },
])('admin can $action → $expected', ({ action, expected }) => {
  const admin: User = { id: 'a', role: 'admin' }
  expect(ability.can(admin, action)).toBe(expected)
})
```

## Testing Components with the `can` Pipe

### Strategy 1: Mock `NgAbilityService`

For isolated component tests, replace the real service with a mock:

```typescript
import { TestBed } from '@angular/core/testing'
import { Component } from '@angular/core'
import { NgAbilityService, CanPipe } from 'ng-ability'

@Component({
  imports: [CanPipe],
  template: `
    @if ('Article' | can: 'create') {
      <button>Create</button>
    }
  `,
})
class HostComponent {}

describe('HostComponent (mocked ability)', () => {
  let mockAbility: { can: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockAbility = { can: vi.fn().mockReturnValue(false) }

    TestBed.configureTestingModule({
      providers: [
        { provide: NgAbilityService, useValue: mockAbility },
      ],
    })
  })

  it('hides the button when permission is denied', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('button')).toBeNull()
  })

  it('shows the button when permission is granted', () => {
    mockAbility.can.mockReturnValue(true)

    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('button')).not.toBeNull()
  })
})
```

### Strategy 2: Integration test with `provideAbilities`

Wire up a real ability context for end-to-end permission coverage:

```typescript
import { signal } from '@angular/core'
import { provideAbilities, ABILITY_CONTEXT } from 'ng-ability'

@Injectable()
class TestContext implements AbilityContext<User> {
  readonly abilityContext = signal<User | null>(null)
}

describe('HostComponent (real abilities)', () => {
  let ctx: TestContext

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAbilities(TestContext, [ArticleAbility]),
      ],
    })
    ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext
  })

  it('reacts to user changes', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('button')).toBeNull()

    ctx.abilityContext.set({ id: 'u1', role: 'editor' })
    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.querySelector('button')).not.toBeNull()
  })
})
```

## Testing Components with `CanDirective`

The structural directive follows the same patterns. Use a host component that exercises the `*can` microsyntax:

```typescript
import { CanDirective } from 'ng-ability'

@Component({
  imports: [CanDirective],
  template: `
    <div *can="['Article', 'edit', article]; else denied">
      ALLOWED
    </div>
    <ng-template #denied>DENIED</ng-template>
  `,
})
class HostWithElseComponent {
  article = new Article(1, 'Test', 'user-1')
}
```

::: warning `await fixture.whenStable()`
Because ng-ability uses Angular Signals internally, permission changes propagate through effects. After updating a signal-based context, call **both** `fixture.detectChanges()` **and** `await fixture.whenStable()` before asserting DOM state:

```typescript
ctx.abilityContext.set({ id: 'other', role: 'viewer' })
fixture.detectChanges()
await fixture.whenStable()
// now safe to assert
```
:::

```typescript
describe('HostWithElseComponent', () => {
  let ctx: TestContext

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAbilities(TestContext, [ArticleAbility]),
      ],
    })
    ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext
  })

  it('shows ALLOWED when user is the author', async () => {
    ctx.abilityContext.set({ id: 'user-1', role: 'viewer' })

    const fixture = TestBed.createComponent(HostWithElseComponent)
    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.textContent).toContain('ALLOWED')
  })

  it('shows DENIED when user lacks permission', async () => {
    ctx.abilityContext.set({ id: 'other', role: 'viewer' })

    const fixture = TestBed.createComponent(HostWithElseComponent)
    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.textContent).toContain('DENIED')
  })
})
```

## Testing `NgAbilityService`

### With mock abilities

Use the `ABILITY` and `ABILITY_CONTEXT` tokens to wire up a minimal service:

```typescript
import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { NgAbilityService, ABILITY, ABILITY_CONTEXT, AbilityFor } from 'ng-ability'

describe('NgAbilityService', () => {
  it('returns false when no abilities are registered', () => {
    const service = TestBed.inject(NgAbilityService)
    expect(service.can('anything', 'read')).toBe(false)
  })

  it('delegates to the matching ability', () => {
    const canSpy = vi.fn().mockReturnValue(true)

    @AbilityFor('Document')
    class MockDocAbility {
      can = canSpy
    }

    TestBed.configureTestingModule({
      providers: [
        { provide: ABILITY, useClass: MockDocAbility, multi: true },
      ],
    })

    const service = TestBed.inject(NgAbilityService)
    expect(service.can('Document', 'read')).toBe(true)
    expect(canSpy).toHaveBeenCalledWith(undefined, 'read', 'Document')
  })
})
```

### With real abilities and context

```typescript
it('uses the context signal value', () => {
  const user = signal<User | null>({ id: 'u1', role: 'editor' })

  TestBed.configureTestingModule({
    providers: [
      provideAbilities(TestContext, [ArticleAbility]),
      {
        provide: ABILITY_CONTEXT,
        useValue: { abilityContext: user },
      },
    ],
  })

  const service = TestBed.inject(NgAbilityService)
  const article = new Article(1, 'Test', 'u1')

  expect(service.can(article, 'edit')).toBe(true)

  user.set({ id: 'u2', role: 'viewer' })
  expect(service.can(article, 'edit')).toBe(false)
})
```

## Testing Route Guards

Route guards are functions returned by the guard factories. Test them with `TestBed.runInInjectionContext`:

```typescript
import { TestBed } from '@angular/core/testing'
import {
  canActivateAbility,
  canMatchAbility,
  provideAbilities,
  ABILITY_CONTEXT,
} from 'ng-ability'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

describe('canActivateAbility', () => {
  let user: ReturnType<typeof signal<User | null>>

  beforeEach(() => {
    user = signal<User | null>({ id: 'u1', role: 'editor' })

    TestBed.configureTestingModule({
      providers: [
        provideAbilities(TestContext, [ArticleAbility]),
        {
          provide: ABILITY_CONTEXT,
          useValue: { abilityContext: user },
        },
      ],
    })
  })

  it('returns true when user has permission', () => {
    const guard = canActivateAbility('Article', 'create')
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    )
    expect(result).toBe(true)
  })

  it('returns false when user lacks permission', () => {
    user.set(null)

    const guard = canActivateAbility('Article', 'create')
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    )
    expect(result).toBe(false)
  })
})
```

### Testing the thing resolver

```typescript
it('passes resolved thing to the ability', () => {
  const article = new Article(1, 'Hello', 'u1')
  const route = { data: { article } } as unknown as ActivatedRouteSnapshot

  const guard = canActivateAbility(
    Article,
    'edit',
    (r) => (r as ActivatedRouteSnapshot).data['article'],
  )

  const result = TestBed.runInInjectionContext(() =>
    guard(route, {} as RouterStateSnapshot),
  )
  expect(result).toBe(true)
})
```

### Testing context changes affect guards

```typescript
it('reflects context changes', () => {
  const guard = canActivateAbility('Article', 'create')
  const run = () =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    )

  user.set({ id: 'u1', role: 'editor' })
  expect(run()).toBe(true)

  user.set(null)
  expect(run()).toBe(false)
})
```

## Testing Permission Transitions

Signal-based contexts make it straightforward to test login, logout, and user-switch flows:

```typescript
import { signal } from '@angular/core'
import {
  NgAbilityService,
  provideAbilities,
  ABILITY_CONTEXT,
  AbilityFor,
  Ability,
  GlobalAbility,
} from 'ng-ability'

@AbilityFor(GlobalAbility)
class ReadOnlyAbility implements Ability<User> {
  can(user: User | null, action: string): boolean {
    if (user?.readOnly && action !== 'view') return false
    return true
  }
}

describe('permission transitions', () => {
  let user: ReturnType<typeof signal<User | null>>

  beforeEach(() => {
    user = signal<User | null>(null)

    TestBed.configureTestingModule({
      providers: [
        provideAbilities(TestContext, [
          ReadOnlyAbility,
          ArticleAbility,
        ]),
        {
          provide: ABILITY_CONTEXT,
          useValue: { abilityContext: user },
        },
      ],
    })
  })

  it('denies everything when logged out', () => {
    const svc = TestBed.inject(NgAbilityService)
    expect(svc.can('Article', 'view')).toBe(true)
    expect(svc.can('Article', 'create')).toBe(false)
  })

  it('grants permissions after login', () => {
    const svc = TestBed.inject(NgAbilityService)
    user.set({ id: 'u1', role: 'editor' })

    expect(svc.can('Article', 'create')).toBe(true)
  })

  it('revokes permissions after logout', () => {
    const svc = TestBed.inject(NgAbilityService)
    user.set({ id: 'u1', role: 'editor' })
    expect(svc.can('Article', 'create')).toBe(true)

    user.set(null)
    expect(svc.can('Article', 'create')).toBe(false)
  })

  it('handles user switch', () => {
    const svc = TestBed.inject(NgAbilityService)
    const article = new Article(1, 'Test', 'user-a')

    user.set({ id: 'user-a', role: 'viewer' })
    expect(svc.can(article, 'edit')).toBe(true)

    user.set({ id: 'user-b', role: 'viewer' })
    expect(svc.can(article, 'edit')).toBe(false)
  })

  it('respects global abilities through transitions', () => {
    const svc = TestBed.inject(NgAbilityService)

    user.set({ id: 'u1', role: 'editor', readOnly: true })
    expect(svc.can('Article', 'view')).toBe(true)
    expect(svc.can('Article', 'create')).toBe(false) // blocked by global

    user.set({ id: 'u1', role: 'editor', readOnly: false })
    expect(svc.can('Article', 'create')).toBe(true) // global allows
  })
})
```
