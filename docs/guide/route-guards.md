# Route Guards

ng-ability provides three route guard factories that integrate with Angular's router:

- **`canActivateAbility`** — guards route activation (`canActivate`)
- **`canActivateChildAbility`** — guards child route activation (`canActivateChild`)
- **`canMatchAbility`** — prevents route matching entirely (`canMatch`)

## Basic Usage

### `canActivate` — protect individual routes

```typescript
import { Routes } from '@angular/router'
import { canActivateAbility } from 'ng-ability'

const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility('Article', 'view')],
  },
  {
    path: 'articles/create',
    component: CreateArticleComponent,
    canActivate: [canActivateAbility('Article', 'create')],
  },
]
```

### `canActivateChild` — protect all child routes at once

```typescript
import { canActivateChildAbility } from 'ng-ability'

const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivateChild: [canActivateChildAbility('Admin', 'access')],
    children: [
      { path: 'users',    component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'reports',  component: ReportsComponent },
    ],
  },
]
```

### `canMatch` — prevent route from matching

`canMatch` runs before route parameters are extracted and prevents the route from matching entirely. This lets you define a fallback route for the same path:

```typescript
import { canMatchAbility } from 'ng-ability'

const routes: Routes = [
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canMatch: [canMatchAbility('Admin', 'access')],
  },
  {
    // Fallback: same path, shown when user lacks admin access
    path: 'admin',
    component: AccessDeniedComponent,
  },
]
```

## Advanced Usage

### Thing resolver — accessing route data

All three guards accept an optional third argument: a **thing resolver** callback that receives the activated route snapshot and returns the object to check permissions against.

```typescript
const routes: Routes = [
  {
    path: 'articles/:id',
    component: ArticleDetailComponent,
    resolve: { article: ArticleResolver },
    canActivate: [
      canActivateAbility('Article', 'view', (route) => route.data['article']),
    ],
  },
]
```

#### Using route parameters

```typescript
const routes: Routes = [
  {
    path: 'users/:userId/profile',
    component: UserProfileComponent,
    canActivate: [
      canActivateAbility('User', 'view', (route) => ({
        id: route.params['userId'],
      })),
    ],
  },
]
```

#### Accessing parent route data

```typescript
const routes: Routes = [
  {
    path: 'projects/:projectId',
    resolve: { project: ProjectResolver },
    children: [
      {
        path: 'tasks/:taskId',
        component: TaskComponent,
        canActivate: [
          canActivateAbility('Task', 'view', (route) => {
            const project = route.parent?.data['project']
            const taskId  = route.params['taskId']
            return { projectId: project?.id, id: taskId }
          }),
        ],
      },
    ],
  },
]
```

## Type Safety

Guards are fully type-safe with declared ability actions:

```typescript
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'list' | 'view' | 'create' | 'edit' | 'delete'
    Admin: 'access'
  }
}

// ✓ 'view' is a valid action for 'Article'
canActivate: [canActivateAbility('Article', 'view')]

// ✗ TypeScript error: 'publish' is not declared for 'Article'
canActivate: [canActivateAbility('Article', 'publish')]

// ✓ Unregistered matchers accept any action
canActivate: [canActivateAbility('CustomMatcher', 'any-action')]
```

## Class-Based Matchers

Guards also work with class constructors:

```typescript
const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility(Article, 'view')],
  },
]
```

## Complete Example

```typescript
import { Routes } from '@angular/router'
import {
  canActivateAbility,
  canActivateChildAbility,
  canMatchAbility,
} from 'ng-ability'

declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'list' | 'view' | 'create' | 'edit' | 'delete'
    Admin: 'access'
  }
}

export const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility('Article', 'list')],
  },
  {
    path: 'articles/create',
    component: CreateArticleComponent,
    canActivate: [canActivateAbility('Article', 'create')],
  },
  {
    path: 'articles/:id',
    component: ArticleDetailComponent,
    resolve: { article: ArticleResolver },
    canActivate: [
      canActivateAbility('Article', 'view', (route) => route.data['article']),
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canMatch: [canMatchAbility('Admin', 'access')],
    canActivateChild: [canActivateChildAbility('Admin', 'access')],
    children: [
      { path: 'users',    component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
]
```

## Example with Ability Implementation

```typescript
import { AbilityFor, Ability, provideAbilities } from 'ng-ability'

interface User {
  id: string
  role: 'admin' | 'editor' | 'viewer'
}

@AbilityFor('Article')
export class ArticleAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (!currentUser) return false

    switch (action) {
      case 'list':
      case 'view':
        return true
      case 'edit':
      case 'create':
        return currentUser.role === 'editor' || currentUser.role === 'admin'
      case 'delete':
        return currentUser.role === 'admin'
      default:
        return false
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAbilities([ArticleAbility]),
  ],
}
```

## Unauthorized Handler

When `canActivateAbility` or `canActivateChildAbility` fails, instead of returning `false` (which causes Angular to cancel navigation silently and leave the user on a blank page), it calls the function registered under the `ABILITY_UNAUTHORIZED_HANDLER` injection token.

> **`canMatchAbility` is not affected.** Returning `false` from `canMatch` is intentional — it tells the router to skip to the next matching route. Throwing or redirecting there would prevent that fallback behavior.

### Default behavior — throw

The default handler throws an `AbilityGuardUnauthorizedError` (a subclass of `NgAbilityError`), which propagates to Angular's [navigation error handler](https://angular.dev/api/router/withNavigationErrorHandler):

```typescript
import { withNavigationErrorHandler } from '@angular/router'
import { NgAbilityError } from 'ng-ability'

provideRouter(routes,
  withNavigationErrorHandler((error) => {
    if (error instanceof NgAbilityError) {
      inject(Router).navigate(['/error/403'])
    }
  }),
)
```

### Named handlers

Three ready-made handlers are exported:

| Handler | Behavior |
|---|---|
| `throwAbilityUnauthorizedHandler` | Throws `AbilityGuardUnauthorizedError` *(default)* |
| `cancelAbilityUnauthorizedHandler` | Returns `false`, cancelling navigation silently |
| `redirectAbilityUnauthorizedHandler(url)` | Redirects to the given URL |

### Provide a handler globally

```typescript
import { ABILITY_UNAUTHORIZED_HANDLER, redirectAbilityUnauthorizedHandler } from 'ng-ability'

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: ABILITY_UNAUTHORIZED_HANDLER,
      useValue: redirectAbilityUnauthorizedHandler('/error/403'),
    },
  ],
})
```

### Override per route subtree

Because Angular resolves the token from the route's injector hierarchy, you can override it for a specific subtree via the route's `providers` array without touching the global config:

```typescript
import { ABILITY_UNAUTHORIZED_HANDLER, redirectAbilityUnauthorizedHandler } from 'ng-ability'

const routes: Routes = [
  {
    path: '',
    providers: [
      {
        provide: ABILITY_UNAUTHORIZED_HANDLER,
        useValue: redirectAbilityUnauthorizedHandler('/error/403'),
      },
    ],
    children: [
      {
        path: 'articles',
        canActivate: [canActivateAbility('Article', 'read')],
        component: ArticlesComponent,
      },
    ],
  },
]
```

### Restore pre-2.3 behavior

If you need the old silent-cancel behavior, provide `cancelAbilityUnauthorizedHandler`:

```typescript
import { ABILITY_UNAUTHORIZED_HANDLER, cancelAbilityUnauthorizedHandler } from 'ng-ability'

{ provide: ABILITY_UNAUTHORIZED_HANDLER, useValue: cancelAbilityUnauthorizedHandler }
```

### Custom handler

Any function matching `(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => MaybeAsync<GuardResult>` works:

```typescript
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { ABILITY_UNAUTHORIZED_HANDLER } from 'ng-ability'

{
  provide: ABILITY_UNAUTHORIZED_HANDLER,
  useValue: () => inject(Router).createUrlTree(['/login']),
}
```

## Missing Ability Handler

When `can()` is called but no registered ability matches the given matcher, ng-ability falls back to returning `false`. By default this is silent. Provide an `ABILITY_MISSING_HANDLER` to be notified — useful for catching configuration mistakes in development.

### Default behavior — silent

Nothing happens; `can()` returns `false` as if the ability denied the action.

### Named handlers

Two ready-made handlers are exported:

| Handler | Behavior |
|---|---|
| `warnAbilityMissingHandler` | Logs a `console.warn` with the unmatched matcher and action |
| `throwAbilityMissingHandler` | Throws `AbilityMissingError` |

### Provide a handler

Via the token directly:

```typescript
import { ABILITY_MISSING_HANDLER, warnAbilityMissingHandler } from 'ng-ability'

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ABILITY_MISSING_HANDLER, useValue: warnAbilityMissingHandler },
  ],
})
```

Or via the `provideAbilities` options object:

```typescript
import { provideAbilities, warnAbilityMissingHandler } from 'ng-ability'

provideAbilities({
  abilities: [ArticleAbility],
  missingHandler: warnAbilityMissingHandler,
})
```

### Custom handler

Any function matching `(matcher: unknown, action: string, thing?: unknown) => void` works:

```typescript
import { ABILITY_MISSING_HANDLER } from 'ng-ability'

{
  provide: ABILITY_MISSING_HANDLER,
  useValue: (matcher, action) => {
    myMonitoring.track('ability.missing', { matcher: String(matcher), action })
  },
}
```

## Testing

For patterns on testing route guards — including `TestBed.runInInjectionContext`, thing resolver testing, and context transitions — see the [Testing Guide](./testing#testing-route-guards).
