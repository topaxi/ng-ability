import { inject, Pipe, PipeTransform } from '@angular/core';
import { NgAbilityService } from './ng-ability.service';

@Pipe({
  name: 'can',
  standalone: true,
  pure: false,
})
export class CanPipe implements PipeTransform {
  private readonly ngAbilityService = inject(NgAbilityService);

  transform(thing: unknown, action: string): boolean {
    return this.ngAbilityService.can(action, thing);
  }
}
