# Global Abilities

Global abilities are special abilities that act as gatekeepers for your permission system. They are checked **before** any specific abilities, and **all** global abilities must return `true` for the permission check to proceed.

## Use Cases

Global abilities are ideal for cross-cutting authorization concerns that apply to all or most of your abilities:

- Read-only mode enforcement
- Maintenance mode restrictions
- License or feature flag checks
- Global user status checks (banned, suspended, etc.)
- Tenant-level permissions in multi-tenant applications

## How It Works

When you call `can()`, the permission check follows this flow:

1. **Global Abilities Check** — all global abilities are invoked first
   - If **any** global ability returns `false`, the entire check fails immediately
   - Specific abilities are **not** checked if a global ability fails
2. **Specific Ability Check** — if all global abilities return `true`
   - The matching specific ability is found and invoked
   - That ability's result is returned

## Usage

### 1. Import the `GlobalAbility` symbol

```typescript
import { AbilityFor, Ability, GlobalAbility } from 'ng-ability'
```

### 2. Create a global ability

Mark an ability class with `@AbilityFor(GlobalAbility)` to make it a global ability:

```typescript
@AbilityFor(GlobalAbility)
export class ReadOnlyModeAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    // Block all write operations when user is in read-only mode
    if (currentUser?.readOnly && action !== 'read') {
      return false
    }
    // Allow the check to continue to specific abilities
    return true
  }
}
```

### 3. Register like any other ability

```typescript
import { provideAbilities } from 'ng-ability'

bootstrapApplication(AppComponent, {
  providers: [
    provideAbilities(AbilityUserContext, [
      ReadOnlyModeAbility,  // Global ability
      ArticleAbility,       // Specific abilities
      AdminAreaAbility,
    ]),
  ],
})
```

## Type Safety

The type system enforces that abilities are either global **or** specific — not both:

```typescript
// ✓ Valid: global ability
@AbilityFor(GlobalAbility)
export class ReadOnlyAbility implements Ability<User> { ... }

// ✓ Valid: specific ability
@AbilityFor('Document')
export class DocumentAbility implements Ability<User> { ... }

// ✗ Invalid: cannot mix GlobalAbility with other matchers
@AbilityFor(GlobalAbility, 'Document')  // TypeScript error!
export class InvalidAbility implements Ability<User> { ... }
```

This prevents confusion and ensures a clear separation between global and specific authorization logic.

## Examples

### Example 1: Read-Only Mode

```typescript
interface User {
  id: string
  readOnly: boolean
}

@AbilityFor(GlobalAbility)
export class ReadOnlyModeAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (currentUser?.readOnly && action !== 'read') {
      return false
    }
    return true
  }
}

@AbilityFor('Post')
export class PostAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (action === 'delete') {
      return currentUser?.role === 'admin'
    }
    return true
  }
}

// When user is in read-only mode:
// can('Post', 'read')  → true  (global allows, PostAbility allows)
// can('Post', 'write') → false (blocked by global, PostAbility never checked)
// can('Post', 'delete')→ false (blocked by global, PostAbility never checked)
```

### Example 2: Multiple Global Abilities

All registered global abilities must return `true` for the check to proceed:

```typescript
@AbilityFor(GlobalAbility)
export class MaintenanceModeAbility implements Ability<User> {
  readonly #maintenance = inject(MaintenanceService)

  can(currentUser: User | null, action: string): boolean {
    // Only admins can do anything during maintenance
    if (this.#maintenance.isActive() && currentUser?.role !== 'admin') {
      return false
    }
    return true
  }
}

@AbilityFor(GlobalAbility)
export class FeatureFlagAbility implements Ability<User> {
  readonly #features = inject(FeatureService)

  can(currentUser: User | null, action: string): boolean {
    const requiredFeature = this.#getRequiredFeature(action)
    if (requiredFeature && !this.#features.isEnabled(requiredFeature)) {
      return false
    }
    return true
  }

  #getRequiredFeature(action: string): string | null {
    if (action === 'export') return 'export-feature'
    if (action === 'share')  return 'sharing-feature'
    return null
  }
}
```

### Example 3: Tenant-Level Permissions

```typescript
interface TenantUser {
  id: string
  tenantId: string
  role: string
}

@AbilityFor(GlobalAbility)
export class TenantAccessAbility implements Ability<TenantUser> {
  readonly #tenantService = inject(TenantService)

  can(currentUser: TenantUser | null, action: string, thing?: any): boolean {
    if (!currentUser) return false

    const resourceTenantId = thing?.tenantId
    if (resourceTenantId && resourceTenantId !== currentUser.tenantId) {
      return false  // cross-tenant access denied
    }

    return true
  }
}
```

::: tip Multi-tenant recipe
See the [Multi-Tenant Isolation](./recipes#multi-tenant-isolation) recipe for a complete example combining a tenant gatekeeper global ability with resource-specific abilities.
:::

## Best Practices

1. **Keep global abilities simple** — they run on every `can()` call; keep them fast and focused.
2. **Return `true` to continue** — return `false` only when you want to block the action entirely.
3. **Order doesn't matter** — all global abilities must pass; the order of checking is not guaranteed.
4. **Use for cross-cutting concerns** — use global abilities for concerns that span multiple resources; use specific abilities for resource-specific logic.
5. **Minimize the count** — two or three global abilities is typical; more may indicate a design issue.

## Performance Considerations

- Global abilities are invoked on **every** `can()` call
- Keep global ability logic fast and cache expensive lookups (e.g. feature flag checks)
- Consider injecting a memoized or signal-based service for values that change infrequently
