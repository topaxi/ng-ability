import { inject } from '@angular/core';
import type {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  GuardResult,
  MaybeAsync,
  Route,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';
import { RedirectCommand, Router } from '@angular/router';
import { from, isObservable, of, type Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type {
  AbilityActions,
  AbilityActionsOf,
  AbilityActionFor,
  AbilityMatcher,
} from './interfaces';
import { NgAbilityService } from './ng-ability.service';
import {
  ABILITY_UNAUTHORIZED_HANDLER,
  type AbilityGuardUnauthorizedHandler,
} from './ng-ability.tokens';
import { AbilityGuardUnauthorizedError } from './errors';

/**
 * The default unauthorized handler. Throws an {@link AbilityGuardUnauthorizedError},
 * which propagates to Angular's navigation error handler.
 */
export const throwAbilityUnauthorizedHandler: AbilityGuardUnauthorizedHandler =
  () => {
    throw new AbilityGuardUnauthorizedError();
  };

/**
 * An unauthorized handler that cancels navigation silently by returning `false`.
 * This restores the pre-2.3 behavior for applications that need it.
 */
export const cancelAbilityUnauthorizedHandler: AbilityGuardUnauthorizedHandler =
  () => false;

/**
 * Creates an unauthorized handler that redirects to the given URL.
 *
 * @example
 * ```typescript
 * providers: [
 *   {
 *     provide: ABILITY_UNAUTHORIZED_HANDLER,
 *     useValue: redirectAbilityUnauthorizedHandler('/error/403'),
 *   },
 * ]
 * ```
 */
export function redirectAbilityUnauthorizedHandler(
  url: string,
): AbilityGuardUnauthorizedHandler {
  return () => new RedirectCommand(inject(Router).parseUrl(url));
}

export type AbilityThingResolver<T = unknown> = (
  route: ActivatedRouteSnapshot | Route,
  state: RouterStateSnapshot | UrlSegment[],
) => T;

function intoObservable<T>(value: MaybeAsync<T>): Observable<T> {
  if (isObservable(value)) return value;
  if (value instanceof Promise) return from(value);
  return of(value);
}

function abilityGuard(
  guard: (
    abilityService: NgAbilityService,
    route: ActivatedRouteSnapshot | Route,
    state: RouterStateSnapshot | UrlSegment[],
  ) => MaybeAsync<boolean>,
): (
  route: ActivatedRouteSnapshot | Route,
  state: RouterStateSnapshot | UrlSegment[],
) => MaybeAsync<GuardResult> {
  return (route, state) => {
    const unauthorizedHandler = inject(ABILITY_UNAUTHORIZED_HANDLER);
    const applyHandler = (can: boolean): MaybeAsync<GuardResult> =>
      can ? true : unauthorizedHandler(
        route as ActivatedRouteSnapshot,
        state as RouterStateSnapshot,
      );

    const result = guard(inject(NgAbilityService), route, state);

    if (isObservable(result) || result instanceof Promise) {
      return intoObservable(result).pipe(
        switchMap((can) => intoObservable(applyHandler(can))),
      );
    }
    return applyHandler(result);
  };
}

/**
 * Creates a route guard that checks if the current user has the specified ability.
 *
 * @param matcher - The matcher to identify the ability (string, class, or predicate)
 * @param action - The action to check permission for
 * @param thing - Optional callback to resolve the thing to check permissions against, receives route and state
 * @returns A CanActivateFn that returns true if the ability check passes, false otherwise
 *
 * @example
 * ```typescript
 * import { canActivateAbility } from 'ng-ability';
 *
 * // Simple usage with matcher and action
 * const routes: Routes = [
 *   {
 *     path: 'posts',
 *     component: PostsComponent,
 *     canActivate: [canActivateAbility('Post', 'read')]
 *   }
 * ];
 *
 * // With thing resolver to access route data
 * const routes: Routes = [
 *   {
 *     path: 'posts/:id',
 *     component: PostDetailComponent,
 *     canActivate: [
 *       canActivateAbility('Post', 'view', (route) => route.data['post'])
 *     ]
 *   }
 * ];
 * ```
 */
export function canActivateAbility<M extends keyof AbilityActions>(
  matcher: M,
  action: AbilityActions[NoInfer<M>],
  thing?: AbilityThingResolver,
): CanActivateFn;
export function canActivateAbility<K extends keyof AbilityActions>(
  matcher: new (...args: never[]) => AbilityActionsOf<K>,
  action: AbilityActions[NoInfer<K>],
  thing?: AbilityThingResolver,
): CanActivateFn;
export function canActivateAbility<M>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver,
): CanActivateFn;
export function canActivateAbility<T, M extends AbilityMatcher<T>>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver<T>,
): CanActivateFn;
export function canActivateAbility(
  matcher: unknown,
  action: string,
  thing?: AbilityThingResolver,
): CanActivateFn {
  return abilityGuard((abilityService, route, state) => {
    const resolvedThing = thing
      ? thing(route as ActivatedRouteSnapshot, state as RouterStateSnapshot)
      : matcher;
    return abilityService.can(resolvedThing as never, action as never);
  });
}

/**
 * Creates a route guard that checks if the current user has the specified ability for child routes.
 *
 * @param matcher - The matcher to identify the ability (string, class, or predicate)
 * @param action - The action to check permission for
 * @param thing - Optional callback to resolve the thing to check permissions against, receives route and state
 * @returns A CanActivateChildFn that returns true if the ability check passes, false otherwise
 *
 * @example
 * ```typescript
 * import { canActivateChildAbility } from 'ng-ability';
 *
 * const routes: Routes = [
 *   {
 *     path: 'admin',
 *     component: AdminLayoutComponent,
 *     canActivateChild: [canActivateChildAbility('Admin', 'access')],
 *     children: [
 *       { path: 'users', component: UsersComponent },
 *       { path: 'settings', component: SettingsComponent }
 *     ]
 *   }
 * ];
 * ```
 */
export function canActivateChildAbility<M extends keyof AbilityActions>(
  matcher: M,
  action: AbilityActions[NoInfer<M>],
  thing?: AbilityThingResolver,
): CanActivateChildFn;
export function canActivateChildAbility<K extends keyof AbilityActions>(
  matcher: new (...args: never[]) => AbilityActionsOf<K>,
  action: AbilityActions[NoInfer<K>],
  thing?: AbilityThingResolver,
): CanActivateChildFn;
export function canActivateChildAbility<M>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver,
): CanActivateChildFn;
export function canActivateChildAbility<T, M extends AbilityMatcher<T>>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver<T>,
): CanActivateChildFn;
export function canActivateChildAbility(
  matcher: unknown,
  action: string,
  thing?: AbilityThingResolver,
): CanActivateChildFn {
  return abilityGuard((abilityService, route, state) => {
    const resolvedThing = thing
      ? thing(route as ActivatedRouteSnapshot, state as RouterStateSnapshot)
      : matcher;
    return abilityService.can(resolvedThing as never, action as never);
  });
}

/**
 * Creates a route guard that checks if the current user has the specified ability for route matching.
 * This guard runs before route parameters are extracted and can be used to prevent routes from matching at all.
 *
 * @param matcher - The matcher to identify the ability (string, class, or predicate)
 * @param action - The action to check permission for
 * @param thing - Optional callback to resolve the thing to check permissions against, receives route and segments
 * @returns A CanMatchFn that returns true if the ability check passes, false otherwise
 *
 * @example
 * ```typescript
 * import { canMatchAbility } from 'ng-ability';
 *
 * // Only match this route if user has admin access
 * const routes: Routes = [
 *   {
 *     path: 'admin',
 *     component: AdminComponent,
 *     canMatch: [canMatchAbility('Admin', 'access')]
 *   },
 *   {
 *     path: 'admin',
 *     component: AccessDeniedComponent // Fallback if canMatch fails
 *   }
 * ];
 * ```
 */
export function canMatchAbility<M extends keyof AbilityActions>(
  matcher: M,
  action: AbilityActions[NoInfer<M>],
  thing?: AbilityThingResolver,
): CanMatchFn;
export function canMatchAbility<K extends keyof AbilityActions>(
  matcher: new (...args: never[]) => AbilityActionsOf<K>,
  action: AbilityActions[NoInfer<K>],
  thing?: AbilityThingResolver,
): CanMatchFn;
export function canMatchAbility<M>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver,
): CanMatchFn;
export function canMatchAbility<T, M extends AbilityMatcher<T>>(
  matcher: M,
  action: AbilityActionFor<NoInfer<M>>,
  thing?: AbilityThingResolver<T>,
): CanMatchFn;
export function canMatchAbility(
  matcher: unknown,
  action: string,
  thing?: AbilityThingResolver,
): CanMatchFn {
  // Does not use abilityGuard/ABILITY_UNAUTHORIZED_HANDLER: returning false from
  // canMatch signals the router to skip to the next matching route, which is the
  // intended fallback behavior. Throwing or redirecting here would prevent that.
  return (route, state) => {
    const abilityService = inject(NgAbilityService);
    const resolvedThing = thing
      ? thing(route as Route, state as UrlSegment[])
      : matcher;
    return abilityService.can(resolvedThing as never, action as never);
  };
}
