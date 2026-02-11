import { inject, Pipe, PipeTransform } from '@angular/core';
import type {
  AbilityActions,
  AbilityActionsOf,
  AbilityMatcher,
  AbilityActionFor,
} from './interfaces';
import { NgAbilityService } from './ng-ability.service';

@Pipe({
  name: 'can',
  pure: false,
})
export class CanPipe implements PipeTransform {
  private readonly ngAbilityService = inject(NgAbilityService);

  transform<M extends keyof AbilityActions>(
    matcher: M,
    action: AbilityActions[M],
    thing?: unknown,
  ): boolean;
  transform<K extends keyof AbilityActions>(
    matcher: new (...args: never[]) => AbilityActionsOf<K>,
    action: AbilityActions[K],
    thing?: unknown,
  ): boolean;
  transform<M>(matcher: M, action: AbilityActionFor<NoInfer<M>>): boolean;
  transform<T, M extends AbilityMatcher<T>>(
    matcher: M,
    action: AbilityActionFor<NoInfer<M>>,
    thing: T,
  ): boolean;
  transform(matcher: unknown, action: string, thing?: unknown): boolean {
    if (thing !== undefined) {
      return (this.ngAbilityService.can as (...args: unknown[]) => boolean)(
        matcher,
        action,
        thing,
      );
    }

    return this.ngAbilityService.can(matcher, action);
  }
}
