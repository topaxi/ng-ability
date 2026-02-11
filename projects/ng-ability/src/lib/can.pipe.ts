import { inject, Pipe, PipeTransform } from '@angular/core';
import type { Action } from './interfaces';
import { NgAbilityService } from './ng-ability.service';

@Pipe({
  name: 'can',
  standalone: true,
  pure: false,
})
export class CanPipe implements PipeTransform {
  private readonly ngAbilityService = inject(NgAbilityService);

  transform(matcher: unknown, action: Action, thing?: unknown): boolean {
    if (thing !== undefined) {
      return (this.ngAbilityService.can as (...args: unknown[]) => boolean)(matcher, action, thing);
    }

    return this.ngAbilityService.can(matcher, action);
  }
}
