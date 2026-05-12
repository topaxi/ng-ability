# API Reference

Complete reference for all public exports from `ng-ability`.

## Setup

### `provideAbilities()`

Configures ng-ability in a standalone Angular application. Three call signatures are supported:

```typescript
// Positional: context + abilities
provideAbilities(contextClass: Type<AbilityContext<S>>, abilities: Type<Ability<S>>[]): EnvironmentProviders

// Positional: abilities only (context provided elsewhere)
provideAbilities(abilities: Type<Ability<any>>[]): EnvironmentProviders

// Options object
provideAbilities(options: ProvideAbilitiesOptions): EnvironmentProviders
```

**Example:**

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(AbilityUserContext, [ArticleAbility, AdminAbility]),
  ],
})
```

---

### `ProvideAbilitiesOptions`

Options object accepted by the third `provideAbilities()` overload.

```typescript
interface ProvideAbilitiesOptions {
  /** Context class that implements AbilityContext. Optional if provided elsewhere. */
  context?: Type<AbilityContext<unknown>>
  /** Ability classes to register. */
  abilities: Type<Ability<unknown>>[]
  /** Handler called when a canActivate/canActivateChild guard fails. Defaults to throwing AbilityGuardUnauthorizedError. */
  unauthorizedHandler?: AbilityGuardUnauthorizedHandler
  /** Handler called when no ability is registered for a given matcher. Defaults to noop. */
  missingHandler?: AbilityMissingHandler
  /** Logger for debug output. Defaults to noop. */
  logger?: AbilityLogger
}
```

**Example:**

```typescript
import { provideAbilities, warnAbilityMissingHandler } from 'ng-ability'

provideAbilities({
  context: AbilityUserContext,
  abilities: [ArticleAbility, AdminAbility],
  logger: console,
  missingHandler: warnAbilityMissingHandler,
})
```

---

### `NgAbilityModule.withAbilities()` <Badge type="warning" text="deprecated" />

NgModule-based setup. Use `provideAbilities()` for new projects.

```typescript
NgAbilityModule.withAbilities(
  contextClass: Type<AbilityContext<S>>,
  abilities: Type<Ability<S>>[],
): ModuleWithProviders<NgAbilityModule>
```

---

## Service

### `NgAbilityService`

The main service for checking permissions programmatically.

```typescript
class NgAbilityService {
  can(matcher: AbilityMatcher, action: string, thing?: unknown): boolean
  can(thing: object, action: string): boolean
}
```

**Inject with:**

```typescript
readonly #ability = inject(NgAbilityService)
```

**Overloads:**

| Signature | Description |
|---|---|
| `can(stringKey, action)` | Check by string matcher, no entity |
| `can(stringKey, action, thing)` | Check by string matcher with entity |
| `can(ClassCtor, action)` | Check by class constructor, no entity |
| `can(ClassCtor, action, thing)` | Check by class constructor with entity |
| `can(instance, action)` | Check by entity instance (inferred matcher) |
| `can(fn, action, thing?)` | Check by function matcher |

---

## Template

### `CanPipe`

Impure pipe for permission checks in templates.

```typescript
{{ matcher | can: action }}
{{ matcher | can: action : thing }}
```

**Import:**

```typescript
import { CanPipe } from 'ng-ability'
```

**Examples:**

```html
@if ('Article' | can: 'create') { ... }
@if (article | can: 'edit') { ... }
@if ('Article' | can: 'edit' : draftArticle) { ... }
```

---

### `CanDirective`

Structural directive for conditional rendering based on permissions.

```typescript
*can="[matcher, action]"
*can="[matcher, action, thing]"
*can="[matcher, action]; else tmpl"
*can="[matcher, action, thing]; else tmpl"
```

**Import:**

```typescript
import { CanDirective } from 'ng-ability'
```

**Examples:**

```html
<div *can="['Article', 'create']">...</div>
<div *can="['Article', 'edit', article]; else readOnly">...</div>
<ng-template #readOnly>...</ng-template>
```

---

## Route Guards

### `canActivateAbility()`

Returns a `CanActivateFn` guard.

```typescript
canActivateAbility(matcher, action): CanActivateFn
canActivateAbility(matcher, action, thingResolver): CanActivateFn
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `matcher` | `string \| Class \| Function` | Ability matcher |
| `action` | `string` | Action to check |
| `thingResolver` | `(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => unknown` | Optional resolver for the entity |

---

### `canActivateChildAbility()`

Returns a `CanActivateChildFn` guard. Same signature as `canActivateAbility`.

---

### `canMatchAbility()`

Returns a `CanMatchFn` guard. Same signature as `canActivateAbility`.

> `canMatchAbility` does not use `ABILITY_UNAUTHORIZED_HANDLER`. Returning `false` from `canMatch` tells the router to try the next matching route, which is the intended fallback.

---

## Decorators

### `@AbilityFor(...matchers)`

Registers one or more matchers for an ability class.

```typescript
@AbilityFor(matcher1, matcher2, ...): ClassDecorator
```

**Matcher types:**

| Type | Example | Match logic |
|---|---|---|
| String | `'Article'` | `matcher === passedMatcher` |
| Class | `Article` | `thing instanceof Article` |
| Symbol | `GlobalAbility` | Makes this a global ability |
| Function | `(obj) => obj.__typename === 'Article'` | `fn(thing) === true` |

---

## Interfaces

### `Ability<S, O>`

Interface your ability classes must implement.

```typescript
interface Ability<S, O = unknown> {
  can(subject: S | null, action: string, thing?: O): boolean
}
```

---

### `AbilityContext<S>`

Interface your ability context service must implement.

```typescript
interface AbilityContext<S> {
  abilityContext: Signal<S>
}
```

---

### `AbilityActions`

Augment via declaration merging to register type-safe actions per matcher key.

```typescript
declare module 'ng-ability' {
  interface AbilityActions {
    Article: 'view' | 'create' | 'edit' | 'delete'
    AdminArea: 'view'
  }
}
```

---

### `AbilityActionsOf<K>`

Implement on entity classes to link them to their registered `AbilityActions` key.

```typescript
class Article implements AbilityActionsOf<'Article'> { ... }
```

This enables TypeScript to narrow the allowed actions when passing the class constructor or its instances to `can()`.

---

### `AbilityLogger`

Interface for the logger passed to `ABILITY_LOGGER`. Matches the shape of the browser `console` object, so you can pass `console` directly in development.

```typescript
interface AbilityLogger {
  debug(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}
```

---

### `AbilityGuardUnauthorizedHandler`

Function type for the unauthorized guard handler.

```typescript
type AbilityGuardUnauthorizedHandler = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => MaybeAsync<GuardResult>
```

---

### `AbilityMissingHandler`

Function type for the missing-ability handler. Called when `can()` is invoked with a matcher for which no ability is registered.

```typescript
type AbilityMissingHandler = (
  matcher: unknown,
  action: string,
  thing?: unknown,
) => void
```

---

## Symbols

### `GlobalAbility`

A unique symbol used as a matcher to mark an ability as a global ability.

```typescript
import { GlobalAbility } from 'ng-ability'

@AbilityFor(GlobalAbility)
export class MaintenanceModeAbility implements Ability<User> { ... }
```

Global abilities run before all specific abilities. All global abilities must return `true` for any specific ability to be checked.

---

## Errors

### `NgAbilityError`

Base error class for all ng-ability errors.

### `AbilityGuardUnauthorizedError`

Thrown by `throwAbilityUnauthorizedHandler` (the default unauthorized handler) when a route guard fails. Extends `NgAbilityError`.

```typescript
import { NgAbilityError } from 'ng-ability'
import { withNavigationErrorHandler } from '@angular/router'

provideRouter(routes,
  withNavigationErrorHandler((error) => {
    if (error instanceof NgAbilityError) {
      inject(Router).navigate(['/error/403'])
    }
  }),
)
```

### `AbilityMissingError`

Thrown by `throwAbilityMissingHandler` when no registered ability matches the given matcher. Extends `NgAbilityError`.

---

## Injection Tokens

### `ABILITY_CONTEXT`

The injection token used to provide `AbilityContext`. Typically managed by `provideAbilities()`.

### `ABILITY`

A multi-provider injection token used to provide individual ability classes. Typically managed by `provideAbilities()`.

### `ABILITY_UNAUTHORIZED_HANDLER`

Token for the handler called when a `canActivate` or `canActivateChild` guard fails. Defaults to throwing `AbilityGuardUnauthorizedError`.

Built-in values:

| Export | Behavior |
|---|---|
| `throwAbilityUnauthorizedHandler` | Throws `AbilityGuardUnauthorizedError` *(default)* |
| `cancelAbilityUnauthorizedHandler` | Returns `false`, cancelling navigation silently |
| `redirectAbilityUnauthorizedHandler(url)` | Redirects to the given URL |

See [Route Guards — Unauthorized Handler](./guide/route-guards#unauthorized-handler) for usage examples.

### `ABILITY_MISSING_HANDLER`

Token for the handler called when `can()` is invoked with a matcher for which no ability is registered. Defaults to noop.

Built-in values:

| Export | Behavior |
|---|---|
| `warnAbilityMissingHandler` | Logs a `console.warn` with the matcher and action |
| `throwAbilityMissingHandler` | Throws `AbilityMissingError` |

See [Route Guards — Missing Ability Handler](./guide/route-guards#missing-ability-handler) for usage examples.

### `ABILITY_LOGGER`

Token for the debug logger used internally by `NgAbilityService`. Defaults to a noop logger. Set to `console` (or any `AbilityLogger` implementation) to see ability resolution steps during development.

```typescript
import { ABILITY_LOGGER } from 'ng-ability'

// During development only
{ provide: ABILITY_LOGGER, useValue: console }

// Or via provideAbilities options:
provideAbilities({ abilities: [...], logger: console })
```

Log entries are prefixed with `[ng-ability]` and cover: ability check entry, global ability denials, resolved ability name, missing ability fallback, and final result.
