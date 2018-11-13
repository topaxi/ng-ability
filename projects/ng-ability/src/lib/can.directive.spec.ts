import { TemplateRef, ViewContainerRef } from '@angular/core';
import { NgAbilityService } from './ng-ability.service';
import { CanDirective } from './can.directive';

describe('CanDirective', () => {
  let ngAbilityService: jasmine.SpyObj<NgAbilityService>;
  let templateRef: TemplateRef<any>;
  let viewContainerRef: jasmine.SpyObj<ViewContainerRef>;
  let can: CanDirective;

  beforeEach(() => {
    ngAbilityService = jasmine.createSpyObj('NgAbilityService', ['can']);
    templateRef = {} as any;
    viewContainerRef = jasmine.createSpyObj('ViewContainerRef', [
      'createEmbeddedView',
      'destroy'
    ]);

    can = new CanDirective(ngAbilityService, templateRef, viewContainerRef);
  });

  describe('ngDoCheck()', () => {
    it('should not render anything without can parameter', () => {
      can.ngDoCheck();
      expect(viewContainerRef.createEmbeddedView).not.toHaveBeenCalled();
    });

    it('should call ability service with can parameters', () => {
      can.can = ['edit', 'Article'];
      can.ngDoCheck();
      expect(ngAbilityService.can).toHaveBeenCalledWith('edit', 'Article');

      can.can = ['edit', 'Article', {}];
      can.ngDoCheck();
      expect(ngAbilityService.can).toHaveBeenCalledWith('edit', 'Article', {});
    });

    describe('with permission', () => {
      beforeEach(() => {
        can.can = ['edit', 'Article'];
        ngAbilityService.can.and.returnValue(true);
      });

      it('should render templateRef', () => {
        can.ngDoCheck();
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledWith(
          templateRef
        );
      });

      it('should not rerender on subsequent calls', () => {
        can.ngDoCheck();
        can.ngDoCheck();
        can.ngDoCheck();
        expect(viewContainerRef.createEmbeddedView.calls.count()).toBe(1);
      });

      it('should clear else template and instantiate templateRef', () => {
        const elseTemplate: any = {};
        can.canElse = elseTemplate;
        ngAbilityService.can.and.returnValue(false);
        const elseView = jasmine.createSpyObj('EmbeddedViewRef', ['destroy']);
        viewContainerRef.createEmbeddedView.and.returnValue(elseView);
        can.ngDoCheck();
        ngAbilityService.can.and.returnValue(true);
        can.ngDoCheck();
        expect(elseView.destroy).toHaveBeenCalled();
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledWith(
          templateRef
        );
      });
    });

    describe('without permission', () => {
      beforeEach(() => {
        can.can = ['edit', 'Article'];
        ngAbilityService.can.and.returnValue(false);
      });

      it('should not render templateRef', () => {
        can.ngDoCheck();
        expect(viewContainerRef.createEmbeddedView).not.toHaveBeenCalled();
      });

      it('should render else template', () => {
        const elseTemplate: any = {};
        can.canElse = elseTemplate;
        can.ngDoCheck();
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledWith(
          elseTemplate
        );
      });

      it('should not rerender on subsequent calls', () => {
        can.canElse = {} as any;
        can.ngDoCheck();
        can.ngDoCheck();
        can.ngDoCheck();
        expect(viewContainerRef.createEmbeddedView.calls.count()).toBe(1);
      });

      it('should clear templateRef and instantiate else template', () => {
        const elseTemplate: any = {};
        can.canElse = elseTemplate;
        ngAbilityService.can.and.returnValue(true);
        const embeddedView = jasmine.createSpyObj('EmbeddedViewRef', [
          'destroy'
        ]);
        viewContainerRef.createEmbeddedView.and.returnValue(embeddedView);
        can.ngDoCheck();
        ngAbilityService.can.and.returnValue(false);
        can.ngDoCheck();
        expect(embeddedView.destroy).toHaveBeenCalled();
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledWith(
          elseTemplate
        );
      });
    });
  });
});
