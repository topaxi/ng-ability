import { Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AbilityFor } from './ability';
import { Ability, AbilityContext } from './interfaces';
import { provideAbilities } from './ng-ability.module';
import { ABILITY_CONTEXT, NgAbilityService } from './ng-ability.service';
import { CanPipe } from './can.pipe';

describe('CanPipe', () => {
  let ngAbilityService: { can: ReturnType<typeof vi.fn> };
  let pipe: CanPipe;

  beforeEach(() => {
    ngAbilityService = { can: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: NgAbilityService, useValue: ngAbilityService }],
    });

    pipe = TestBed.runInInjectionContext(() => new CanPipe());
  });

  it('should call ability service with thing and action', () => {
    ngAbilityService.can.mockReturnValue(true);
    pipe.transform('Article', 'create');
    expect(ngAbilityService.can).toHaveBeenCalledWith('Article', 'create');
  });

  it('should return true when ability is granted', () => {
    ngAbilityService.can.mockReturnValue(true);
    expect(pipe.transform('Article', 'create')).toBe(true);
  });

  it('should return false when ability is denied', () => {
    ngAbilityService.can.mockReturnValue(false);
    expect(pipe.transform('Article', 'create')).toBe(false);
  });

  it('should work with object instances', () => {
    const article = { id: 1, title: 'Test' };
    ngAbilityService.can.mockReturnValue(true);
    expect(pipe.transform(article, 'edit')).toBe(true);
    expect(ngAbilityService.can).toHaveBeenCalledWith(article, 'edit');
  });

  it('should pass thing as third argument when provided', () => {
    const article = { id: 1, title: 'Test' };
    ngAbilityService.can.mockReturnValue(true);
    pipe.transform('Article', 'edit', article);
    expect(ngAbilityService.can).toHaveBeenCalledWith(
      'Article',
      'edit',
      article,
    );
  });
});

describe('CanPipe (with abilityContext)', () => {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAbilities(TestContext, [ArticleAbility])],
    });
  });

  it('should return updated result when abilityContext signal changes', () => {
    const pipe = TestBed.runInInjectionContext(() => new CanPipe());
    expect(pipe.transform('Article', 'edit')).toBe(true);

    const ctx = TestBed.inject(ABILITY_CONTEXT) as TestContext;
    ctx.abilityContext.set({ allowed: false });
    expect(pipe.transform('Article', 'edit')).toBe(false);

    ctx.abilityContext.set({ allowed: true });
    expect(pipe.transform('Article', 'edit')).toBe(true);
  });
});
