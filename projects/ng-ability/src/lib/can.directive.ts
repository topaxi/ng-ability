import {
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { AbilityMatcher, Action } from './interfaces';
import { NgAbilityService } from './ng-ability.service';

@Directive({
  selector: '[can]',
})
export class CanDirective {
  readonly can = input<
    [unknown, Action] | [AbilityMatcher<unknown>, Action, unknown?]
  >();

  readonly canElse = input<TemplateRef<void> | null>(null);

  private readonly ngAbilityService = inject(NgAbilityService);
  private readonly templateRef = inject(TemplateRef<void>);
  private readonly viewContainer = inject(ViewContainerRef);

  private embeddedView: EmbeddedViewRef<void> | null = null;
  private elseView: EmbeddedViewRef<void> | null = null;

  constructor() {
    effect(() => {
      const canArgs = this.can();

      if (
        canArgs != null &&
        (this.ngAbilityService.can as (...args: unknown[]) => boolean).apply(
          this.ngAbilityService,
          canArgs,
        ) === true
      ) {
        if (this.elseView !== null) {
          this.elseView.destroy();
          this.elseView = null;
        }

        if (this.embeddedView === null) {
          this.embeddedView = this.viewContainer.createEmbeddedView(
            this.templateRef,
          );
        }
      } else {
        const canElse = this.canElse();

        if (this.embeddedView !== null) {
          this.embeddedView.destroy();
          this.embeddedView = null;
        }

        if (canElse != null && this.elseView === null) {
          this.elseView = this.viewContainer.createEmbeddedView(canElse);
        }
      }
    });
  }
}
