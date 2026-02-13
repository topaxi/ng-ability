# Route Guards

Route guards for integrating ng-ability permissions with Angular routing.

## Available Guards

- **`canActivateAbility`** - Guard for route activation (`canActivate`)
- **`canActivateChildAbility`** - Guard for child route activation (`canActivateChild`)
- **`canMatchAbility`** - Guard for route matching (`canMatch`)

## Basic Usage

### canActivate - Route Activation

Protects individual routes from unauthorized access:

```typescript
import { Routes } from '@angular/router';
import { canActivateAbility } from 'ng-ability';

const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility('Article', 'view')]
  },
  {
    path: 'articles/create',
    component: CreateArticleComponent,
    canActivate: [canActivateAbility('Article', 'create')]
  },
  {
    path: 'articles/:id/edit',
    component: EditArticleComponent,
    canActivate: [canActivateAbility('Article', 'edit')]
  }
];
```

### canActivateChild - Child Routes

Protects all child routes with a single guard:

```typescript
import { canActivateChildAbility } from 'ng-ability';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivateChild: [canActivateChildAbility('Admin', 'access')],
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'reports', component: ReportsComponent }
    ]
  }
];
```

### canMatch - Route Matching

Prevents routes from matching entirely based on permissions. Runs before route parameters are extracted:

```typescript
import { canMatchAbility } from 'ng-ability';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canMatch: [canMatchAbility('Admin', 'access')]
  },
  {
    // Fallback route if user doesn't have admin access
    path: 'admin',
    component: AccessDeniedComponent
  }
];
```

## Advanced Usage

### Thing Resolver - Accessing Route Data

All guards support an optional `thing` parameter - a callback that receives the route and state to resolve what to check permissions against:

```typescript
import { canActivateAbility } from 'ng-ability';

const routes: Routes = [
  {
    path: 'posts/:id',
    component: PostDetailComponent,
    resolve: { post: PostResolver },
    canActivate: [
      // Check permissions against the resolved post
      canActivateAbility('Post', 'view', (route) => route.data['post'])
    ]
  }
];
```

#### Using Route Parameters

```typescript
const routes: Routes = [
  {
    path: 'users/:userId/profile',
    component: UserProfileComponent,
    canActivate: [
      canActivateAbility('User', 'view', (route) => ({
        id: route.params['userId']
      }))
    ]
  }
];
```

#### Accessing Parent Route Data

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
          // Access parent route's resolved data
          canActivateAbility('Task', 'view', (route) => {
            const project = route.parent?.data['project'];
            const taskId = route.params['taskId'];
            return { projectId: project?.id, id: taskId };
          })
        ]
      }
    ]
  }
];
```

## Type Safety

All guards are fully type-safe and work with declared ability actions:

```typescript
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'edit' | 'delete' | 'create';
    Post: 'read' | 'write';
  }
}

// ✅ Type-safe: 'view' is a valid action for 'Article'
canActivate: [canActivateAbility('Article', 'view')]

// ❌ Type error: 'publish' is not declared for 'Article'
canActivate: [canActivateAbility('Article', 'publish')]

// ✅ Works: unregistered matchers accept any action
canActivate: [canActivateAbility('CustomMatcher', 'any-action')]
```

## Using with Class-Based Matchers

Guards also work with class-based matchers:

```typescript
import { Routes } from '@angular/router';
import { canActivateAbility } from 'ng-ability';

class Article {
  id: string;
  title: string;
}

const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility(Article, 'view')]
  }
];
```

## Complete Example

```typescript
import { Routes } from '@angular/router';
import {
  canActivateAbility,
  canActivateChildAbility,
  canMatchAbility,
} from 'ng-ability';

// Type declarations
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'list' | 'view' | 'create' | 'edit' | 'delete';
    Admin: 'access';
  }
}

export const routes: Routes = [
  {
    path: 'articles',
    component: ArticlesComponent,
    canActivate: [canActivateAbility('Article', 'list')]
  },
  {
    path: 'articles/create',
    component: CreateArticleComponent,
    canActivate: [canActivateAbility('Article', 'create')]
  },
  {
    path: 'articles/:id',
    component: ArticleDetailComponent,
    resolve: { article: ArticleResolver },
    canActivate: [
      canActivateAbility('Article', 'view', (route) => route.data['article'])
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canMatch: [canMatchAbility('Admin', 'access')],
    canActivateChild: [canActivateChildAbility('Admin', 'access')],
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
```

## Example with Ability Implementation

```typescript
import { AbilityFor, Ability, provideAbilities } from 'ng-ability';

interface User {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
}

@AbilityFor('Article')
export class ArticleAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (!currentUser) return false;

    switch (action) {
      case 'view':
      case 'list':
        return true; // All authenticated users can view
      case 'edit':
      case 'create':
        return currentUser.role === 'editor' || currentUser.role === 'admin';
      case 'delete':
        return currentUser.role === 'admin';
      default:
        return false;
    }
  }
}

// Register the ability
import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAbilities([ArticleAbility]),
    // ... other providers
  ]
};
```
