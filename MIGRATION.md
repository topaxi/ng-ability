# Migration Guide: Angular 21 Upgrade

This guide helps you migrate from the latest stable release to the Angular 21 version.

## Breaking Changes

### 1. Angular 21 Requirement

**What changed:** The library now requires Angular 21 as a peer dependency.

**Migration:**
```bash
# Upgrade your Angular application to version 21 first
ng update @angular/core@21 @angular/cli@21
```

### 2. `can()` Method Argument Order Changed

**What changed:** The `NgAbilityService.can()` method argument order has been reversed.

**Before:**
```typescript
// Old signature
service.can(action, thing)
service.can(action, matcher, thing)
```

**After:**
```typescript
// New signature
service.can(matcher, action)
service.can(matcher, action, thing)
```

**Migration:**
```typescript
// Before
if (abilityService.can('read', post)) { }
if (abilityService.can('edit', Post, post)) { }

// After
if (abilityService.can(post, 'read')) { }
if (abilityService.can(Post, 'edit', post)) { }
```

### 3. `[can]` Directive Input Array Order Changed

**What changed:** The directive input array argument order has been reversed to match the new `can()` signature.

**Before:**
```html
<!-- Old syntax -->
<div *can="['read', post]">...</div>
<div *can="['edit', Post, post]">...</div>
```

**After:**
```html
<!-- New syntax -->
<div *can="[post, 'read']">...</div>
<div *can="[Post, 'edit', post]">...</div>
```

### 4. Directive API Changed to Signals

**What changed:** The `CanDirective` now uses Angular's signal-based inputs instead of `@Input()` decorators.

**Impact:** This change is mostly internal, but if you were programmatically accessing or manipulating the directive inputs, you'll need to use the signal API:

**Before:**
```typescript
@ViewChild(CanDirective) canDirective: CanDirective;

// Old way
this.canDirective.can = ['read', post];
```

**After:**
```typescript
// Signal inputs are read-only from outside the directive
// Set values through template bindings instead
```

### 5. Directive Lifecycle Changed

**What changed:** The directive now uses `effect()` instead of `ngDoCheck()` for reactivity.

**Impact:** This improves performance and integrates better with Angular's signal-based change detection. No code changes required unless you were extending the directive.

### 6. `AbilityContext` Interface Changed to Signals

**What changed:** The `AbilityContext` interface now uses a Signal instead of a getter method.

**Before:**
```typescript
interface AbilityContext<S> {
  getAbilityContext(): S;
}

// Implementation
class MyContext implements AbilityContext<User> {
  getAbilityContext(): User {
    return this.currentUser;
  }
}
```

**After:**
```typescript
interface AbilityContext<S> {
  readonly abilityContext: Signal<S>;
}

// Implementation
class MyContext implements AbilityContext<User> {
  abilityContext = signal(this.currentUser);

  // Or computed signal
  abilityContext = computed(() => this.currentUser);
}
```

### 7. Tokens Moved to Separate File

**What changed:** `ABILITY` and `ABILITY_CONTEXT` injection tokens have moved from `ng-ability.service.ts` to `ng-ability.tokens.ts`.

**Migration:**
```typescript
// Before
import { ABILITY, ABILITY_CONTEXT } from 'ng-ability';

// After (still works, tokens are re-exported from public-api.ts)
import { ABILITY, ABILITY_CONTEXT } from 'ng-ability';

// Or import from tokens file directly
import { ABILITY, ABILITY_CONTEXT } from 'ng-ability/tokens';
```

**Note:** If you were importing directly from the service file, update your imports.

## New Features

### Can Pipe

A new `can` pipe has been added for use in templates:

```html
<!-- Using the pipe -->
<button [disabled]="!(post | can:'edit')">Edit</button>
<button [disabled]="!(Post | can:'delete':post)">Delete</button>
```

The pipe follows the same signature as the `can()` method:
```
thing | can:action
matcher | can:action:thing
```

## Migration Checklist

- [ ] Upgrade to Angular 21
- [ ] Update all `can()` method calls to use new argument order
- [ ] Update all `[can]` directive arrays to use new argument order
- [ ] Update `AbilityContext` implementations to use signals
- [ ] Test all ability checks throughout your application
- [ ] Consider using the new `can` pipe where appropriate
- [ ] Review and update any custom extensions of ng-ability classes

## Need Help?

If you encounter issues during migration, please [open an issue](https://github.com/topaxi/ng-ability/issues) with details about your use case.
