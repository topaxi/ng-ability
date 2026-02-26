# Type Safety

By default, the `action` parameter in `can()` calls accepts any `string`. ng-ability offers two mechanisms to narrow this to the specific actions that are valid for each matcher.

## Declaring Actions with `AbilityActions`

Use TypeScript [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to register allowed actions per matcher key on the `AbilityActions` interface:

```typescript
// e.g. src/ability-actions.d.ts
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit' | 'delete'
    AdminArea: 'view'
    Post: 'read' | 'write'
  }
}
```

With this declaration in place, `can()` calls using registered string matchers will:
- Suggest only the declared actions in autocomplete
- Still accept any string (to avoid breaking unregistered actions)

```typescript
ability.can('Article', 'edit')    // ✓ suggests 'view' | 'create' | 'edit' | 'delete'
ability.can('AdminArea', 'view')  // ✓ suggests 'view'
ability.can('Article', 'publish') // still accepted — no compile error, just no suggestion
```

## `AbilityActionsOf` for Class Matchers

When you use a **class constructor** as a matcher, TypeScript cannot infer which actions apply to that class without extra help. The `AbilityActionsOf<K>` interface links a class to its registered actions:

```typescript
import { AbilityActionsOf } from 'ng-ability'

// 1. Declare actions
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit' | 'delete'
  }
}

// 2. Implement AbilityActionsOf on your class
export class Article implements AbilityActionsOf<'Article'> {
  constructor(
    public id: number,
    public title: string,
    public authorId: number,
  ) {}
}
```

Now TypeScript enforces the allowed actions when passing the `Article` constructor:

```typescript
ability.can(Article, 'view')    // ✓ valid
ability.can(Article, 'edit')    // ✓ valid
ability.can(Article, 'delete')  // ✓ valid
ability.can(Article, 'publish') // ✗ TypeScript error: 'publish' is not assignable
```

### With instances

Type narrowing also works when passing an `Article` **instance** — ng-ability recognises it as an `Article` via the matcher:

```typescript
const article = new Article(1, 'Hello', 42)

ability.can(article, 'edit')    // ✓ valid, actions narrowed to Article actions
ability.can(article, 'publish') // ✗ TypeScript error
```

## Benefits

| Without `AbilityActionsOf` | With `AbilityActionsOf` |
|---|---|
| `ability.can(Article, 'anything')` compiles | `ability.can(Article, 'unknown')` is a TS error |
| No IDE suggestions for class matchers | Autocomplete shows valid actions |
| Typos caught only at runtime | Typos caught at compile time |

`AbilityActionsOf` is especially valuable when:
- You have many entity classes with different allowed actions
- Multiple teams work on different parts of the codebase
- You want classes to be self-documenting about their permission model

## Enforcement in Abilities

Declare actions in your ability implementations to take advantage of the same type information:

```typescript
import { AbilityFor, Ability } from 'ng-ability'
import { Article } from './article.model'

type ArticleAction = AbilityActions['Article'] // 'view' | 'create' | 'edit' | 'delete'

@AbilityFor(Article, 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: ArticleAction, article?: Article): boolean {
    // TypeScript narrows `action` to the declared union
    switch (action) {
      case 'view':   return true
      case 'create': return currentUser != null
      case 'edit':
      case 'delete': return currentUser?.id === article?.authorId
    }
  }
}
```
