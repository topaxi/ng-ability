# Recipes & Examples

Self-contained patterns for common ng-ability use cases, ordered from everyday to specialized.

## RBAC (Role-Based Access Control)

A role hierarchy helper keeps your abilities clean and consistent.

### Role hierarchy

```typescript
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  editor: 1,
  admin:  2,
}

function hasRole(user: User | null, minimumRole: string): boolean {
  if (!user) return false
  return (ROLE_HIERARCHY[user.role] ?? -1) >= (ROLE_HIERARCHY[minimumRole] ?? Infinity)
}
```

### Ability using the helper

```typescript
import { AbilityFor, Ability } from 'ng-ability'

@AbilityFor(Article, 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(user: User | null, action: string, article?: Article): boolean {
    switch (action) {
      case 'view':   return true
      case 'create': return hasRole(user, 'editor')
      case 'edit':   return hasRole(user, 'editor') && user!.id === article?.authorId
      case 'delete': return hasRole(user, 'admin')
      default:       return false
    }
  }
}
```

### Type-safe action declarations

```typescript
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit' | 'delete'
  }
}
```

With this declaration, `can('Article', 'editt')` will show a TypeScript warning in your IDE. See [Type Safety](./type-safety) for full details.

## GraphQL Integration

GraphQL responses are plain objects without class constructors, so `instanceof` matchers won't work. Use function matchers with `__typename` instead.

### Basic `__typename` matcher

```typescript
@AbilityFor((obj: any) => obj.__typename === 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(user: User | null, action: string, article?: Article): boolean {
    // ...
  }
}
```

### Reusable matcher factory

If you have many GraphQL types, create a factory to avoid repetition:

```typescript
function gqlMatcher<T extends { __typename: string }>(
  typename: T['__typename'],
): (obj: any) => obj is T {
  return (obj: any): obj is T => obj?.__typename === typename
}

@AbilityFor(gqlMatcher<GqlArticle>('Article'))
export class ArticleAbility implements Ability<User, GqlArticle> {
  can(user: User | null, action: string, article?: GqlArticle): boolean {
    // ...
  }
}
```

### Combining string and function matchers

You can register both a string key (for `can('Article', 'create')` checks without an instance) and a function matcher (for GraphQL objects) on the same ability:

```typescript
@AbilityFor('Article', gqlMatcher<GqlArticle>('Article'))
export class ArticleAbility implements Ability<User, GqlArticle> {
  can(user: User | null, action: string, article?: GqlArticle): boolean {
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

```typescript
// Works with string matcher (no instance)
ability.can('Article', 'create')

// Works with GraphQL response object
const result = await graphql.query(...)
ability.can(result.article, 'edit')
```

## Feature Modules

Use `provideAbilities()` at the root level for your main abilities, and in lazy-loaded routes for feature-specific abilities.

### Root registration

```typescript
// app.config.ts
import { provideAbilities } from 'ng-ability'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAbilities(AbilityUserContext, [
      ArticleAbility,
      CommentAbility,
    ]),
  ],
}
```

### Lazy route with additional abilities

```typescript
// admin.routes.ts
import { provideAbilities } from 'ng-ability'

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    providers: [
      provideAbilities([AdminDashboardAbility, AuditLogAbility]),
    ],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'audit',     component: AuditComponent },
    ],
  },
]
```

::: tip
When calling `provideAbilities()` without a context class, the context registered at the root level is reused automatically. You only need to pass the context class once.
:::

## Reactive Filtered Lists

Use `computed()` with `NgAbilityService.can()` to filter entities based on the current user's permissions. The result updates automatically when the user changes.

### Filter entities

```typescript
import { Component, computed, inject, input } from '@angular/core'
import { NgAbilityService } from 'ng-ability'

@Component({
  selector: 'app-article-list',
  template: `
    @for (article of editableArticles(); track article.id) {
      <app-article-card [article]="article" />
    }
  `,
})
export class ArticleListComponent {
  readonly #ability = inject(NgAbilityService)

  articles = input<Article[]>([])

  editableArticles = computed(() =>
    this.articles().filter(a => this.#ability.can(a, 'edit')),
  )
}
```

### Permission map for bulk UI

When you need to show different UI per item (edit button, delete button, etc.), compute a permission map once rather than calling `can()` repeatedly in the template:

```typescript
@Component({
  selector: 'app-article-list',
  template: `
    @for (entry of articlesWithPerms(); track entry.article.id) {
      <div>
        <span>{{ entry.article.title }}</span>
        @if (entry.canEdit) {
          <button>Edit</button>
        }
        @if (entry.canDelete) {
          <button>Delete</button>
        }
      </div>
    }
  `,
})
export class ArticleListComponent {
  readonly #ability = inject(NgAbilityService)

  articles = input<Article[]>([])

  articlesWithPerms = computed(() =>
    this.articles().map(article => ({
      article,
      canEdit:   this.#ability.can(article, 'edit'),
      canDelete: this.#ability.can(article, 'delete'),
    })),
  )
}
```

## Form Integration

Use an `effect()` to reactively enable or disable form controls when permissions change:

```typescript
import { Component, effect, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NgAbilityService } from 'ng-ability'

@Component({
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" />
      <textarea formControlName="body"></textarea>
      <button type="submit" [disabled]="!form.enabled">Save</button>
    </form>
  `,
})
export class ArticleFormComponent {
  readonly #ability = inject(NgAbilityService)
  readonly #fb = inject(FormBuilder)

  article = input.required<Article>()

  form = this.#fb.group({
    title: [''],
    body: [''],
  })

  constructor() {
    effect(() => {
      const canEdit = this.#ability.can(this.article(), 'edit')

      if (canEdit) {
        this.form.enable()
      } else {
        this.form.disable()
      }
    })
  }
}
```

## Multi-Tenant Isolation

Combine a [global ability](./global-abilities) for tenant-level gatekeeper logic with specific abilities for resource-level checks.

### Tenant gatekeeper (global ability)

```typescript
import { AbilityFor, Ability, GlobalAbility } from 'ng-ability'

interface TenantUser {
  id: string
  tenantId: string
  role: string
}

@AbilityFor(GlobalAbility)
export class TenantIsolationAbility implements Ability<TenantUser> {
  can(user: TenantUser | null, action: string, thing?: any): boolean {
    if (!user) return false

    // If the resource belongs to a tenant, ensure it matches the user's tenant
    if (thing?.tenantId && thing.tenantId !== user.tenantId) {
      return false
    }

    return true
  }
}
```

### Resource-specific ability

```typescript
@AbilityFor(Project, 'Project')
export class ProjectAbility implements Ability<TenantUser, Project> {
  can(user: TenantUser | null, action: string, project?: Project): boolean {
    switch (action) {
      case 'view':   return true
      case 'edit':   return user?.role === 'admin' || user?.role === 'editor'
      case 'delete': return user?.role === 'admin'
      default:       return false
    }
  }
}
```

### Registration

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(TenantUserContext, [
      TenantIsolationAbility,  // global — runs first on every check
      ProjectAbility,
    ]),
  ],
})
```

Now `can(project, 'edit')` will:
1. Check `TenantIsolationAbility` — reject if `project.tenantId` doesn't match the user's
2. Only if the global check passes, check `ProjectAbility` for the specific action

## Permission-Aware Navigation

### Computed approach (in code)

Build a navigation list that automatically updates when the user's permissions change:

```typescript
import { Component, computed, inject } from '@angular/core'
import { NgAbilityService } from 'ng-ability'

interface NavItem {
  label: string
  route: string
}

@Component({
  selector: 'app-sidebar',
  template: `
    <nav>
      @for (item of visibleNav(); track item.route) {
        <a [routerLink]="item.route">{{ item.label }}</a>
      }
    </nav>
  `,
})
export class SidebarComponent {
  readonly #ability = inject(NgAbilityService)

  visibleNav = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Articles', route: '/articles' },
    ]

    if (this.#ability.can('Article', 'create')) {
      items.push({ label: 'New Article', route: '/articles/new' })
    }

    if (this.#ability.can('AdminArea', 'view')) {
      items.push({ label: 'Admin', route: '/admin' })
    }

    return items
  })
}
```

### Template-only approach (with `can` pipe)

For simpler cases, use the pipe directly in the template without building a navigation model:

```typescript
import { CanPipe } from 'ng-ability'

@Component({
  imports: [CanPipe],
  template: `
    <nav>
      <a routerLink="/articles">Articles</a>

      @if ('Article' | can: 'create') {
        <a routerLink="/articles/new">New Article</a>
      }

      @if ('AdminArea' | can: 'view') {
        <a routerLink="/admin">Admin</a>
      }
    </nav>
  `,
})
export class SidebarComponent {}
```

::: tip Which approach to choose?
Use the **template-only** approach when you just need to show/hide links. Use the **computed** approach when navigation items come from a dynamic data source, or when you need the filtered list in code (e.g., for keyboard navigation or testing).
:::
