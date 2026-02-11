import { TemplateRef, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgAbilityService } from './ng-ability.service';
import { CanDirective } from './can.directive';

describe('CanDirective', () => {
  let ngAbilityService: { can: ReturnType<typeof vi.fn> };
  let templateRef: TemplateRef<any>;
  let viewContainerRef: { createEmbeddedView: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> };
  let can: CanDirective;

  beforeEach(() => {
    ngAbilityService = { can: vi.fn() };
    templateRef = {} as any;
    viewContainerRef = {
      createEmbeddedView: vi.fn(),
      destroy: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: NgAbilityService, useValue: ngAbilityService },
        { provide: TemplateRef, useValue: templateRef },
        { provide: ViewContainerRef, useValue: viewContainerRef },
      ],
    });

    can = TestBed.runInInjectionContext(() => new CanDirective());
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
        ngAbilityService.can.mockReturnValue(true);
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
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(1);
      });

      it('should clear else template and instantiate templateRef', () => {
        const elseTemplate: any = {};
        can.canElse = elseTemplate;
        ngAbilityService.can.mockReturnValue(false);
        const elseView = { destroy: vi.fn() };
        viewContainerRef.createEmbeddedView.mockReturnValue(elseView);
        can.ngDoCheck();
        ngAbilityService.can.mockReturnValue(true);
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
        ngAbilityService.can.mockReturnValue(false);
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
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(1);
      });

      it('should clear templateRef and instantiate else template', () => {
        const elseTemplate: any = {};
        can.canElse = elseTemplate;
        ngAbilityService.can.mockReturnValue(true);
        const embeddedView = { destroy: vi.fn() };
        viewContainerRef.createEmbeddedView.mockReturnValue(embeddedView);
        can.ngDoCheck();
        ngAbilityService.can.mockReturnValue(false);
        can.ngDoCheck();
        expect(embeddedView.destroy).toHaveBeenCalled();
        expect(viewContainerRef.createEmbeddedView).toHaveBeenCalledWith(
          elseTemplate
        );
      });
    });
  });
});
