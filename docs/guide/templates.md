# Template Usage

ng-ability provides two ways to check permissions in Angular templates: the `can` pipe and the `*can` structural directive.

## The `can` Pipe

Import `CanPipe` in your standalone component or `NgAbilityModule` in your NgModule to use the `can` pipe.

```typescript
import { CanPipe } from 'ng-ability'

@Component({
  imports: [CanPipe],
  template: `...`
})
export class MyComponent {}
```

### Basic usage

Pass the matcher as the pipe value and the action as the first argument:

```html
@if ('Article' | can: 'create') {
  <button>Write article</button>
}

@if ('AdminArea' | can: 'view') {
  <a routerLink="/admin">Admin panel</a>
}
```

### With an entity instance

When the entity can be inferred automatically (via `instanceof` or a function matcher), pass it directly as the pipe value:

```html
@if (article | can: 'edit') {
  <button (click)="edit(article)">Edit</button>
}
```

### With an explicit matcher and entity

When the entity cannot be inferred on its own, pass an explicit matcher as the pipe value and the entity as the third argument:

```html
@if ('Article' | can: 'read' : draftArticle) {
  I can read this draft article!
}
```

This is useful when:
- The entity is a plain object without a class hierarchy
- You want to use a string matcher with a specific entity instance

## The `*can` Directive

Import `CanDirective` in your standalone component or `NgAbilityModule` in your NgModule to use the `*can` directive.

```typescript
import { CanDirective } from 'ng-ability'

@Component({
  imports: [CanDirective],
  template: `...`
})
export class MyComponent {}
```

The directive accepts a tuple `[matcher, action]` or `[matcher, action, thing]`:

```html
<div *can="['Article', 'create']">
  I can create new articles!
</div>
```

### With an entity

```html
<div *can="['Article', 'edit', article]">
  <button (click)="edit(article)">Edit article</button>
</div>
```

### With an `else` template

```html
<div *can="['Article', 'edit', article]; else readOnly">
  <button (click)="edit(article)">Edit</button>
</div>
<ng-template #readOnly>
  <p>This article is read-only.</p>
</ng-template>
```

## Reactivity

Both the pipe and directive are **reactive** — they use Angular Signals internally and automatically re-evaluate when the ability context (current user) changes. No manual subscriptions or `markForCheck()` calls are needed.

## Comparison

| | `can` pipe | `*can` directive |
|---|---|---|
| Syntax | `matcher \| can: 'action'` | `*can="[matcher, 'action']"` |
| `else` template | via `@if`/`@else` | via `; else tmpl` |
| Works with `@if` | Yes | No (is itself structural) |
| Inline expressions | More flexible | Less verbose for simple cases |

## Examples

### Navigation with permission checks

```html
<nav>
  <a routerLink="/articles">Articles</a>

  @if ('Article' | can: 'create') {
    <a routerLink="/articles/new">New Article</a>
  }

  @if ('AdminArea' | can: 'view') {
    <a routerLink="/admin">Admin</a>
  }
</nav>
```

### Article card

```html
<article>
  <h2>{{ article.title }}</h2>
  <p>{{ article.body }}</p>

  <div class="actions">
    @if (article | can: 'edit') {
      <button (click)="edit(article)">Edit</button>
    }
    @if (article | can: 'delete') {
      <button (click)="delete(article)">Delete</button>
    }
  </div>
</article>
```

### Admin section with directive

```html
<div *can="['AdminArea', 'view']">
  <h2>Admin Dashboard</h2>
  <!-- admin content -->
</div>
```
