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
