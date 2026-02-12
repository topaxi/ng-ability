# ng-ability

Define access control lists in Angular.

## Installation

```bash
npm install --save ng-ability
```

## Usage

### 1. Define an ability context

The ability context provides the current user (or other subject) to your ability checks:

```typescript
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop'
import { AbilityContext } from 'ng-ability';

@Injectable({ providedIn: 'root' })
export class AbilityUserContext implements AbilityContext<User> {
  readonly #auth = inject(AuthService);

  readonly abilityContext = toSignal(this.#auth.getCurrentUser());
}
```

If your auth service uses signals, you can directly use them:

```typescript
@Injectable({ providedIn: 'root' })
export class AbilityUserContext implements AbilityContext<User> {
  readonly #auth = inject(AuthService);

  // If auth.currentUser is already a Signal<User | null>
  readonly abilityContext = this.#auth.currentUser;
}
```

### 2. Define abilities

Define abilities for pages, models, and other data:

```typescript
import { AbilityFor, Ability } from 'ng-ability';

// Define ability for Article instance objects, the string 'Article'
// and graphql like objects using a matching function
@AbilityFor(Article, 'Article', article => article.__typename === 'Article')
export class ArticleAbility implements Ability<User, Article> {
  can(currentUser: User | null, action: string, article: Article) {
    if (currentUser != null && currentUser.admin) {
      // Admins can do anything
      return true;
    }

    switch (action) {
      case 'view': // Everyone can view articles
        return true;
      case 'create': // Every user can create new articles
        return currentUser != null;
      case 'edit': // Users can only edit their own articles
        return currentUser != null && currentUser.id === article.authorId;
      default:
        return false;
    }
  }
}

@AbilityFor('AdminArea')
export class AdminAreaAbility implements Ability<User> {
  can(currentUser: User | null, action: string) {
    switch (action) {
      case 'view': // Only admins can view the admin area
        return currentUser != null && currentUser.admin;
      default:
        return false;
    }
  }
}
```

### 3. Register abilities

**Standalone (recommended):**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAbilities } from 'ng-ability';
import { AbilityUserContext } from './ability-user-context';
import { ArticleAbility } from './abilities/article.ability';
import { AdminAreaAbility } from './abilities/admin-area.ability';

bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(AbilityUserContext, [ArticleAbility, AdminAreaAbility]),
  ],
});
```

**NgModule:**

```typescript
import { NgModule } from '@angular/core';
import { NgAbilityModule } from 'ng-ability';

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

### 4. Check abilities

**In templates** using the `can` pipe (import `CanPipe` or `NgAbilityModule`):

```html
@if ('Article' | can: 'create') {
  I can create new articles!
}

@if (latestArticle | can: 'edit') {
  <button (click)="editArticle(latestArticle)">Edit latest article</button>
} @else {
  <div>Latest article is not editable :(</div>
}
```

When an entity can be identified on its own — for example via `instanceof` or a
field like `__typename` in GraphQL responses — passing it directly is enough.
If the entity cannot be inferred, you can pass an explicit matcher as the pipe
value and the entity as a third argument:

```html
@if ('Article' | can: 'read' : draftArticle) {
  I can read this draft article!
}
```

Alternatively, you can use the `*can` structural directive (import `CanDirective` or `NgAbilityModule`):

```html
<div *can="['Article', 'create']">
  I can create new articles!
</div>
<div *can="['Article', 'edit', latestArticle]; else noteditable">
  <button (click)="editArticle(latestArticle)">Edit latest article</button>
</div>
<ng-template #noteditable>
  <div>Latest article is not editable :(</div>
</ng-template>
```

**In code** using the `NgAbilityService`:

```typescript
import { Component, inject } from '@angular/core';
import { NgAbilityService } from 'ng-ability';

@Component({ ... })
export class AppComponent {
  readonly #ability = inject(NgAbilityService);

  editArticle(article: Article) {
    // When the entity can be inferred (e.g., via instanceof)
    if (this.#ability.can(article, 'edit')) {
      // edit article...
    }
  }

  createNewArticle() {
    // When checking a string matcher without an entity
    if (this.#ability.can('Article', 'create')) {
      // create article...
    }
  }

  editDraftArticle(draftArticle: unknown) {
    // When explicit matcher is needed
    if (this.#ability.can('Article', 'edit', draftArticle)) {
      // edit draft article...
    }
  }
}
```

### 5. Type-safe action strings (optional)

By default, the `action` parameter accepts any string. You can register known
actions per matcher via declaration merging on the `AbilityActions` interface to
get autocompletion:

```typescript
// e.g. in src/ability-actions.d.ts
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit';
    AdminArea: 'view';
  }
}
```

With this in place, calls using a registered matcher key will suggest the
corresponding actions:

```typescript
ability.can('Article', 'edit');     // autocomplete suggests 'view' | 'create' | 'edit'
ability.can('AdminArea', 'view');   // autocomplete suggests 'view'
ability.can(article, 'edit');       // non-string matcher: suggests all registered actions
```

Arbitrary action strings are still accepted — the type narrows suggestions
without rejecting unknown actions.

#### Using `AbilityActionsOf` with class-based matchers

When using class constructors as matchers, you can implement the `AbilityActionsOf<K>`
interface to narrow the allowed actions based on your `AbilityActions` declaration:

```typescript
import { AbilityActionsOf } from 'ng-ability';

// Declare your actions mapping
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit';
  }
}

// Link your class to the 'Article' actions
export class Article implements AbilityActionsOf<'Article'> {
  constructor(
    public id: number,
    public title: string,
    public authorId: number,
  ) {}
}
```

Now when you pass the `Article` class constructor to ability checks, TypeScript
will narrow the allowed actions to `'view' | 'create' | 'edit'`:

```typescript
// In components or services
ability.can(Article, 'view');       // ✓ valid
ability.can(Article, 'edit');       // ✓ valid
ability.can(Article, 'delete');     // ✗ TypeScript error: 'delete' is not assignable

// With an instance
const myArticle = new Article(1, 'Hello', 42);
ability.can(Article, 'edit', myArticle);  // ✓ valid with narrowed actions
```

**Why use `AbilityActionsOf`?**

Without `AbilityActionsOf`, passing a class constructor accepts any action string,
since TypeScript can't infer which actions apply to that class. By implementing
`AbilityActionsOf<K>`, you create a type-level link between your class and its
registered actions, enabling:

- **Type safety**: Catch typos and invalid actions at compile time
- **Autocompletion**: IDE suggests only valid actions for that class
- **Self-documenting code**: The class declaration shows which actions are supported

This is especially useful when:
- You have many entity classes with different actions
- You want to prevent mistakes like checking `ability.can(User, 'edit')` when `User` only supports `'view'`
- You're passing class constructors instead of string matchers

## Development

### Build

```bash
npm run build
```

### Running unit tests

```bash
npm test
```
