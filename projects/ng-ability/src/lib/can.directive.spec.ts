import { Component, Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AbilityFor } from './ability';
import { Ability, AbilityContext } from './interfaces';
import { provideAbilities } from './ng-ability.module';
import { ABILITY_CONTEXT } from './ng-ability.service';
import { CanDirective } from './can.directive';

@Injectable()
class TestContext implements AbilityContext<{ allowed: boolean }> {
  readonly abilityContext = signal({ allowed: true });
}

@AbilityFor('Article')
class ArticleAbility implements Ability<{ allowed: boolean }, string> {
  can(subject: { allowed: boolean } | null) {
    return subject?.allowed ?? false;
  }
}

@Component({
  template: `<div *can="['Article', 'edit']">ALLOWED</div>`,
  imports: [CanDirective],
})
class HostComponent {}

@Component({
  template: `
    <div *can="['Article', 'edit']; else denied">ALLOWED</div>
    <ng-template #denied>DENIED</ng-template>
  `,
  imports: [CanDirective],
})
class HostWithElseComponent {}

describe('CanDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAbilities(TestContext, [ArticleAbility])],
    });
  });

  describe('with permission', () => {
    it('should render content when permission is granted', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');
    });

    it('should not render else template when permission is granted', () => {
      const fixture = TestBed.createComponent(HostWithElseComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');
      expect(fixture.nativeElement.textContent).not.toContain('DENIED');
    });
  });

  describe('without permission', () => {
    it('should not render content when permission is denied', async () => {
      const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;
      ctx.abilityContext.set({ allowed: false });

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).not.toContain('ALLOWED');
    });

    it('should render else template when permission is denied', async () => {
      const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;
      ctx.abilityContext.set({ allowed: false });

      const fixture = TestBed.createComponent(HostWithElseComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('DENIED');
      expect(fixture.nativeElement.textContent).not.toContain('ALLOWED');
    });
  });

  describe('toggling permission', () => {
    it('should update when context changes from allowed to denied', async () => {
      const fixture = TestBed.createComponent(HostWithElseComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');

      const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;
      ctx.abilityContext.set({ allowed: false });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('DENIED');
      expect(fixture.nativeElement.textContent).not.toContain('ALLOWED');
    });

    it('should update when context changes from denied to allowed', async () => {
      const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;
      ctx.abilityContext.set({ allowed: false });

      const fixture = TestBed.createComponent(HostWithElseComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('DENIED');

      ctx.abilityContext.set({ allowed: true });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');
      expect(fixture.nativeElement.textContent).not.toContain('DENIED');
    });

    it('should re-render on every abilityContext change without input changes', async () => {
      const fixture = TestBed.createComponent(HostWithElseComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');

      const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;

      // Revoke permission
      ctx.abilityContext.set({ allowed: false });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('DENIED');
      expect(fixture.nativeElement.textContent).not.toContain('ALLOWED');

      // Grant again
      ctx.abilityContext.set({ allowed: true });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('ALLOWED');
      expect(fixture.nativeElement.textContent).not.toContain('DENIED');

      // Revoke once more
      ctx.abilityContext.set({ allowed: false });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('DENIED');
      expect(fixture.nativeElement.textContent).not.toContain('ALLOWED');
    });
  });
});
