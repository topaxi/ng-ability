# API Reference

Complete reference for all public exports from `ng-ability`.

## Setup

### `provideAbilities()`

Configures ng-ability in a standalone Angular application.

```typescript
// With ability context
provideAbilities(contextClass: Type<AbilityContext<S>>, abilities: Type<Ability<S>>[]): EnvironmentProviders

// Without ability context (context provided elsewhere)
provideAbilities(abilities: Type<Ability<any>>[]): EnvironmentProviders
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

## Injection Tokens

### `ABILITY_CONTEXT`

The injection token used to provide `AbilityContext`. Typically managed by `provideAbilities()`.

### `ABILITY`

A multi-provider injection token used to provide individual ability classes. Typically managed by `provideAbilities()`.
