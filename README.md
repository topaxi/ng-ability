# NgAbilityApp

Define access control lists in Angular.

## Installation

```bash
$ npm install --save ng-ability
# or
$ yarn add ng-ability
```

## Usage

Define ability context, for example using the current user:

```typescript
import { Injectable } from '@angular/core';
import { AbilityContext } from 'ng-ability';

@Injectable({ providedIn: 'root' })
export class AbilityUserContext {
  constructor(private readonly auth: AuthService) {}

  getAbilityContext(): User | null {
    return this.auth.getCurrentUser();
  }
}
```

Define abilities for pages, models and other data:

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

Import the NgAbilityModule into your application:

```typescript
import { NgModule } from '@angular/core';
import { NgAbilityModule } from 'ng-ability';
import { AbilityUserContext } from './ability-user-context';
import { ArticleAbility } from './abilities/article.ability';
import { AdminAreaAbility } from './abilities/admin-area.ability';

@NgModule({
  imports: [
    NgAbilityModule.withAbilities(AbilityUserContext, [
      ArticleAbility,
      AdminAreaAbility
    ])
  ]
})
export class AppModule {}
```

Check for abilities in your application and template code:

```typescript
import { Component } from '@angular/core';
import { NgAbilityService } from 'ng-ability';

@Component({
  template: `
    <div *can="['create', 'Article']">
      I can create new articles!
    </div>
    <div *can="['edit', latestArticle]; else noteditable">
      <button (click)="editArticle(latestArticle)">Edit latest article</button>
    </div>
    <ng-template #noteditable>
      <div>Latest article is not editable :(</div>
    </ng-template>
  `
})
export class AppComponent {
  get latestArticle(): Article {
    return this.articleService.getLatestArticle();
  }

  constructor(
    private readonly ability: NgAbilityService,
    private readonly articleService: ArticleService
  ) {}

  editArticle(article: Article) {
    if (this.ability.can('edit', article)) {
      // edit article...
    }
  }
}
```

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
