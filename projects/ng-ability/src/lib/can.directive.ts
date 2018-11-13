import {
  Directive,
  Input,
  DoCheck,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef
} from '@angular/core';
import { AbilityMatcher } from './interfaces';
import { NgAbilityService } from './ng-ability.service';

@Directive({
  selector: '[can]' // tslint:disable-line
})
export class CanDirective implements DoCheck {
  @Input()
  can?: [string, any] | [string, AbilityMatcher<any>, any?];

  @Input()
  canElse: TemplateRef<void> | null = null;

  private embeddedView: EmbeddedViewRef<void> | null = null;
  private elseView: EmbeddedViewRef<void> | null = null;

  constructor(
    private readonly ngAbilityService: NgAbilityService,
    private readonly templateRef: TemplateRef<void>,
    private readonly viewContainer: ViewContainerRef
  ) {}

  ngDoCheck(): void {
    if (
      this.can != null &&
      this.ngAbilityService.can.apply(this.ngAbilityService, this.can) === true
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
