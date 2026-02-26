# Programmatic Usage

Use `NgAbilityService` to check permissions in components, services, and other classes.

## Injecting the Service

```typescript
import { Component, inject } from '@angular/core'
import { NgAbilityService } from 'ng-ability'

@Component({ ... })
export class ArticleComponent {
  readonly #ability = inject(NgAbilityService)
}
```

## The `can()` Method

The service exposes a single `can()` method with the same signature as the template pipe and directive:

```typescript
can(matcher, action, thing?)
```

### String matcher

```typescript
if (this.#ability.can('Article', 'create')) {
  // current user can create articles
}
```

### Class instance (inferred matcher)

When the entity's class is registered as a matcher, pass the instance directly:

```typescript
const article = new Article(1, 'Hello World', authorId)

if (this.#ability.can(article, 'edit')) {
  // matched via instanceof Article
}
```

### Explicit matcher with entity

Use this when you need a specific matcher alongside an object that can't be inferred:

```typescript
if (this.#ability.can('Article', 'edit', draftArticle)) {
  // draftArticle checked against ArticleAbility
}
```

### Class constructor matcher

You can also pass a class constructor directly:

```typescript
if (this.#ability.can(Article, 'create')) {
  // checked against abilities registered with Article constructor
}
```

## Examples

### Component with permission guards

```typescript
import { Component, inject } from '@angular/core'
import { NgAbilityService } from 'ng-ability'
import { Article } from './article.model'
import { ArticleService } from './article.service'

@Component({
  selector: 'app-article-detail',
  template: `
    <h1>{{ article.title }}</h1>
    @if (canEdit) {
      <button (click)="edit()">Edit</button>
    }
  `,
})
export class ArticleDetailComponent {
  readonly #ability = inject(NgAbilityService)
  readonly #articleService = inject(ArticleService)

  article = this.#articleService.current()

  get canEdit() {
    return this.#ability.can(this.article, 'edit')
  }

  edit() {
    if (!this.#ability.can(this.article, 'edit')) return
    // proceed with edit
  }
}
```

### Service with permission checks

```typescript
import { Injectable, inject } from '@angular/core'
import { NgAbilityService } from 'ng-ability'
import { Article } from './article.model'

@Injectable({ providedIn: 'root' })
export class ArticleActionsService {
  readonly #ability = inject(NgAbilityService)
  readonly #http = inject(HttpClient)

  delete(article: Article) {
    if (!this.#ability.can(article, 'delete')) {
      throw new Error('Permission denied')
    }
    return this.#http.delete(`/api/articles/${article.id}`)
  }
}
```

### Filtering based on permissions

```typescript
@Component({ ... })
export class ArticleListComponent {
  readonly #ability = inject(NgAbilityService)

  articles = input<Article[]>([])

  editableArticles = computed(() =>
    this.articles().filter(a => this.#ability.can(a, 'edit'))
  )
}
```

::: tip Prefer template checks
For UI visibility toggles, prefer using the `can` pipe or `*can` directive in templates — they're more idiomatic Angular and automatically reactive. Use `NgAbilityService` in code when you need to guard logic, not just UI.
:::

::: tip Reactive lists recipe
See the [Reactive Filtered Lists](./recipes#reactive-filtered-lists) recipe for a permission map pattern that computes per-item permissions once for bulk UI rendering.
:::
