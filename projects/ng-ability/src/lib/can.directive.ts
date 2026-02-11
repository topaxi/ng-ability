import {
  Directive,
  DoCheck,
  EmbeddedViewRef,
  inject,
  Input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { AbilityMatcher, Action } from './interfaces';
import { NgAbilityService } from './ng-ability.service';

@Directive({
  selector: '[can]',
  standalone: true,
})
export class CanDirective implements DoCheck {
  @Input()
  can?: [unknown, Action] | [AbilityMatcher<unknown>, Action, unknown?];

  @Input()
  canElse: TemplateRef<void> | null = null;

  private readonly ngAbilityService = inject(NgAbilityService);
  private readonly templateRef = inject(TemplateRef<void>);
  private readonly viewContainer = inject(ViewContainerRef);

  private embeddedView: EmbeddedViewRef<void> | null = null;
  private elseView: EmbeddedViewRef<void> | null = null;

  ngDoCheck(): void {
    if (
      this.can != null &&
      (this.ngAbilityService.can as (...args: unknown[]) => boolean).apply(this.ngAbilityService, this.can) === true
    ) {
      if (this.elseView !== null) {
        this.elseView.destroy();
        this.elseView = null;
      }

      if (this.embeddedView === null) {
        this.embeddedView = this.viewContainer.createEmbeddedView(
          this.templateRef
        );
      }
    } else {
      if (this.embeddedView !== null) {
        this.embeddedView.destroy();
        this.embeddedView = null;
      }

      if (this.canElse != null && this.elseView === null) {
        this.elseView = this.viewContainer.createEmbeddedView(this.canElse);
      }
    }
  }
}
