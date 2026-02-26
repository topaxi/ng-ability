# What is ng-ability?

**ng-ability** is a type-safe access control library for Angular. It lets you define permission logic in dedicated _ability_ classes and check those permissions anywhere in your app — in templates, services, or route guards — using a consistent, reactive API built on Angular Signals.

## Features

- **Flexible matchers** — match permissions by class instance, class constructor, string key, or a custom function
- **Signal-based reactivity** — templates update automatically when the current user's permissions change
- **Type-safe actions** — declare allowed actions per matcher via TypeScript declaration merging
- **Global abilities** — cross-cutting checks (maintenance mode, feature flags) that run before any specific ability
- **Route guards** — protect routes with `canActivate`, `canActivateChild`, and `canMatch` guards

## Installation

::: code-group

```bash [npm]
npm install ng-ability
```

```bash [pnpm]
pnpm add ng-ability
```

```bash [yarn]
yarn add ng-ability
```

:::

## Quick Start

### 1. Define an ability context

The ability context provides the current user (or other subject) to your ability checks:

```typescript
import { Injectable, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { AbilityContext } from 'ng-ability'

@Injectable({ providedIn: 'root' })
export class AbilityUserContext implements AbilityContext<User> {
  readonly #auth = inject(AuthService)

  readonly abilityContext = toSignal(this.#auth.getCurrentUser())
}
```

If your auth service already uses signals:

```typescript
@Injectable({ providedIn: 'root' })
export class AbilityUserContext implements AbilityContext<User> {
  readonly #auth = inject(AuthService)

  // auth.currentUser is a Signal<User | null>
  readonly abilityContext = this.#auth.currentUser
}
```

### 2. Define an ability

```typescript
import { AbilityFor, Ability } from 'ng-ability'

@AbilityFor(Article, 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: string, article?: Article) {
    if (currentUser?.admin) return true

    switch (action) {
      case 'view':   return true
      case 'create': return currentUser != null
      case 'edit':   return currentUser != null && currentUser.id === article?.authorId
      default:       return false
    }
  }
}
```

### 3. Register abilities

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAbilities } from 'ng-ability'

bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(AbilityUserContext, [ArticleAbility]),
  ],
})
```

### 4. Check permissions

**In templates:**

```html
@if ('Article' | can: 'create') {
  <button>Write article</button>
}

@if (article | can: 'edit') {
  <button (click)="edit(article)">Edit</button>
}
```

**In code:**

```typescript
@Component({ ... })
export class AppComponent {
  readonly #ability = inject(NgAbilityService)

  save(article: Article) {
    if (this.#ability.can(article, 'edit')) {
      // ...
    }
  }
}
```

## Next Steps

- [Defining Abilities](./abilities) — learn about matchers, the `@AbilityFor` decorator, and registration
- [Template Usage](./templates) — `can` pipe and `*can` directive in depth
- [Programmatic Usage](./service) — using `NgAbilityService` in components and services
- [Type Safety](./type-safety) — declare actions and link classes to their allowed actions
- [Global Abilities](./global-abilities) — cross-cutting permission checks
- [Route Guards](./route-guards) — protecting routes with ability-based guards
- [Testing](./testing) — unit and integration testing patterns for abilities
- [Recipes](./recipes) — RBAC, GraphQL, multi-tenant, and more real-world examples
