# Global Abilities

Global abilities are special abilities that act as gatekeepers for your permission system. They are checked **before** any specific abilities, and **all** global abilities must return `true` for the permission check to proceed.

## Use Cases

Global abilities are perfect for implementing cross-cutting authorization concerns that apply to all or most of your abilities, such as:

- Read-only mode enforcement
- Maintenance mode restrictions
- License/feature flag checks
- Global user status checks (banned, suspended, etc.)
- Tenant-level permissions in multi-tenant applications

## Usage

### 1. Import the GlobalAbility Symbol

```typescript
import { AbilityFor, Ability, GlobalAbility } from 'ng-ability';
```

### 2. Create a Global Ability

Mark any ability class with `@AbilityFor(GlobalAbility)` to make it a global ability:

```typescript
@AbilityFor(GlobalAbility)
export class ReadOnlyModeAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    // Block all write operations when user is in read-only mode
    if (currentUser?.readOnly && action !== 'read') {
      return false;
    }
    // Allow the check to continue to specific abilities
    return true;
  }
}
```

### 3. Register the Global Ability

Register it like any other ability using `provideAbilities()`:

```typescript
import { provideAbilities } from 'ng-ability';
import { ReadOnlyModeAbility } from './abilities/read-only-mode.ability';
import { PostAbility } from './abilities/post.ability';
import { CommentAbility } from './abilities/comment.ability';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAbilities([
      ReadOnlyModeAbility,  // Global ability
      PostAbility,          // Specific abilities
      CommentAbility,
      // ... other abilities
    ])
  ]
};
```

## How It Works

When you call `can()`, the permission check follows this flow:

1. **Global Abilities Check**: All global abilities are invoked first
   - If **any** global ability returns `false`, the entire check fails immediately
   - Specific abilities are **not** checked if a global ability fails

2. **Specific Ability Check**: If all global abilities return `true`
   - The matching specific ability is found and invoked
   - That ability's result is returned

## Examples

### Example 1: Read-Only Mode

```typescript
interface User {
  id: string;
  readOnly: boolean;
}

@AbilityFor(GlobalAbility)
export class ReadOnlyModeAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (currentUser?.readOnly && action !== 'read') {
      return false;
    }
    return true;
  }
}

@AbilityFor('Post')
export class PostAbility implements Ability<User> {
  can(currentUser: User | null, action: string): boolean {
    if (action === 'delete') {
      return currentUser?.role === 'admin';
    }
    return true;
  }
}

// Usage in a component:
export class PostComponent {
  private abilityService = inject(NgAbilityService);

  // When user is in read-only mode:
  // - can('Post', 'read') → true (allowed by global ability)
  // - can('Post', 'write') → false (blocked by global ability, PostAbility never checked)
  // - can('Post', 'delete') → false (blocked by global ability, PostAbility never checked)

  // When user is NOT in read-only mode:
  // - can('Post', 'read') → true (global passes, PostAbility allows)
  // - can('Post', 'write') → true (global passes, PostAbility allows)
  // - can('Post', 'delete') → depends on role (global passes, PostAbility checks role)
}
```

### Example 2: Multiple Global Abilities

You can have multiple global abilities - all must return `true`:

```typescript
@AbilityFor(GlobalAbility)
export class MaintenanceModeAbility implements Ability<User> {
  private maintenance = inject(MaintenanceService);

  can(currentUser: User | null, action: string): boolean {
    // Only admins can do anything during maintenance
    if (this.maintenance.isActive() && currentUser?.role !== 'admin') {
      return false;
    }
    return true;
  }
}

@AbilityFor(GlobalAbility)
export class FeatureFlagAbility implements Ability<User> {
  private features = inject(FeatureService);

  can(currentUser: User | null, action: string): boolean {
    // Check if the action requires a feature flag
    const requiredFeature = this.getRequiredFeature(action);
    if (requiredFeature && !this.features.isEnabled(requiredFeature)) {
      return false;
    }
    return true;
  }

  private getRequiredFeature(action: string): string | null {
    // Map actions to feature flags
    if (action === 'export') return 'export-feature';
    if (action === 'share') return 'sharing-feature';
    return null;
  }
}
```

### Example 3: Tenant-Level Permissions

```typescript
interface TenantUser {
  id: string;
  tenantId: string;
  role: string;
}

@AbilityFor(GlobalAbility)
export class TenantAccessAbility implements Ability<TenantUser> {
  private tenantService = inject(TenantService);

  can(currentUser: TenantUser | null, action: string, thing?: any): boolean {
    if (!currentUser) return false;

    // Check if user's tenant has access to the resource
    const resourceTenantId = thing?.tenantId;
    if (resourceTenantId && resourceTenantId !== currentUser.tenantId) {
      return false; // User can't access resources from other tenants
    }

    return true;
  }
}
```

## Type Safety

The type system enforces that abilities are either global OR specific, not both:

```typescript
// ✓ Valid: Global ability
@AbilityFor(GlobalAbility)
export class ReadOnlyAbility implements Ability<User> { ... }

// ✓ Valid: Specific ability
@AbilityFor('Document')
export class DocumentAbility implements Ability<User> { ... }

// ✗ Invalid: Cannot mix GlobalAbility with other matchers
@AbilityFor(GlobalAbility, 'Document')  // TypeScript error!
export class InvalidAbility implements Ability<User> { ... }
```

This prevents confusion and ensures clear separation between global and specific authorization logic. If you need both global checks and specific resource checks, create two separate abilities.

## Best Practices

1. **Keep Global Abilities Simple**: They run on every permission check, so keep them fast and focused.

2. **Return `true` to Continue**: Global abilities should return `true` to allow the check to proceed to specific abilities. Only return `false` when you want to block the action entirely.

3. **Order Doesn't Matter**: All global abilities are checked, and the order doesn't matter (they all must return `true`).

4. **Use for Cross-Cutting Concerns**: Global abilities are for concerns that span across multiple resources/actions. Use specific abilities for resource-specific logic.

## Performance Considerations

- Global abilities are called on **every** permission check
- Keep global ability logic fast and efficient
- Consider caching expensive operations (like feature flag checks)
- Minimize the number of global abilities (2-3 is typical)
