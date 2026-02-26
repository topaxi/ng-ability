# Defining Abilities

Abilities are the core building block of ng-ability. Each ability class handles the permission logic for a specific resource or concern.

## Ability Context

Before defining abilities, you need an _ability context_ — a service that provides the current user (or subject) as a Signal.

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

The `AbilityContext<S>` interface requires a single property:

```typescript
interface AbilityContext<S> {
  abilityContext: Signal<S>
}
```

If your auth service already exposes a signal, you can use it directly:

```typescript
@Injectable({ providedIn: 'root' })
export class AbilityUserContext implements AbilityContext<User> {
  readonly abilityContext = inject(AuthService).currentUser
}
```

## The `@AbilityFor` Decorator

The `@AbilityFor()` decorator registers one or more _matchers_ for an ability class. When `can()` is called, ng-ability finds the ability whose matchers match the first argument.

```typescript
import { AbilityFor, Ability } from 'ng-ability'

@AbilityFor('Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: string, article?: Article): boolean {
    // ...
  }
}
```

### Matchers

Three types of matchers are supported:

#### String matcher

The simplest form — a string key that you pass to `can()`:

```typescript
@AbilityFor('Article')
export class ArticleAbility implements Ability<User> { ... }
```

```typescript
abilityService.can('Article', 'create')
```

#### Class matcher

Pass a class constructor. ng-ability uses `instanceof` checks automatically:

```typescript
@AbilityFor(Article)
export class ArticleAbility implements Ability<User, Article> { ... }
```

```typescript
const article = new Article(...)
abilityService.can(article, 'edit')  // matched via instanceof Article
```

#### Function matcher

A predicate that receives the thing and returns `true` if the ability applies:

```typescript
@AbilityFor(article => article.__typename === 'Article')
export class ArticleAbility implements Ability<User, Article> { ... }
```

Useful for GraphQL responses and other data without a class hierarchy.

#### Multiple matchers

You can combine matchers on a single ability class:

```typescript
@AbilityFor(Article, 'Article', article => article.__typename === 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: string, article?: Article): boolean {
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

## Full Example

```typescript
import { AbilityFor, Ability } from 'ng-ability'

interface User {
  id: number
  admin: boolean
}

class Article {
  constructor(
    public id: number,
    public title: string,
    public authorId: number,
  ) {}
}

@AbilityFor(Article, 'Article', (obj: any) => obj.__typename === 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: string, article?: Article): boolean {
    if (currentUser?.admin) return true

    switch (action) {
      case 'view':   return true
      case 'create': return currentUser != null
      case 'edit':   return currentUser != null && currentUser.id === article?.authorId
      default:       return false
    }
  }
}

@AbilityFor('AdminArea')
export class AdminAreaAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    switch (action) {
      case 'view': return currentUser?.admin ?? false
      default:     return false
    }
  }
}
```

## Registering Abilities

### Standalone (recommended)

Use `provideAbilities()` in your application or module providers:

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAbilities } from 'ng-ability'

bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(AbilityUserContext, [
      ArticleAbility,
      AdminAreaAbility,
    ]),
  ],
})
```

You can also call `provideAbilities()` without a context class if the context is provided elsewhere:

```typescript
provideAbilities([ArticleAbility, AdminAreaAbility])
```

### NgModule (deprecated)

```typescript
import { NgModule } from '@angular/core'
import { NgAbilityModule } from 'ng-ability'

@NgModule({
  imports: [
    NgAbilityModule.withAbilities(AbilityUserContext, [
      ArticleAbility,
      AdminAreaAbility,
    ]),
  ],
})
export class AppModule {}
```
