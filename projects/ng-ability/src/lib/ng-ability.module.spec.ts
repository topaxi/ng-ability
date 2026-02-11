import { Injectable, NgModule, signal } from '@angular/core';
import { TestBed, TestModuleMetadata } from '@angular/core/testing';
import { AbilityFor } from './ability';
import { Ability, AbilityContext } from './interfaces';
import {
  ABILITY,
  ABILITY_CONTEXT,
  NgAbilityService,
} from './ng-ability.service';
import { NgAbilityModule, provideAbilities } from './ng-ability.module';

@Injectable()
class TestContext implements AbilityContext<{ userId: string }> {
  readonly abilityContext = signal({ userId: '42' });
}

@AbilityFor('Article')
class ArticleAbility implements Ability<{ userId: string }, string> {
  can = vi.fn(() => true);
}

@AbilityFor('Comment')
class CommentAbility implements Ability<{ userId: string }, string> {
  can = vi.fn(() => false);
}

@AbilityFor('Post')
class PostAbility implements Ability<{ userId: string }, string> {
  can = vi.fn(() => true);
}

@NgModule({
  imports: [NgAbilityModule],
  exports: [NgAbilityModule],
  providers: [{ provide: ABILITY, useClass: PostAbility, multi: true }],
})
class PostSubModule {}

describe.each<{
  name: string;
  withAbilitiesOnly(): TestModuleMetadata;
  withContextAndAbilities(): TestModuleMetadata;
  withAdditionalAbilitiesFromSubmodule(): TestModuleMetadata;
}>([
  {
    name: 'provideAbilities',
    withAbilitiesOnly: () => ({
      providers: [provideAbilities([ArticleAbility, CommentAbility])],
    }),
    withContextAndAbilities: () => ({
      providers: [
        provideAbilities(TestContext, [ArticleAbility, CommentAbility]),
      ],
    }),
    withAdditionalAbilitiesFromSubmodule: () => ({
      providers: [
        provideAbilities(TestContext, [ArticleAbility, CommentAbility]),
        provideAbilities([PostAbility]),
      ],
    }),
  },
  {
    name: 'NgAbilityModule.withAbilities',
    withAbilitiesOnly: () => ({
      imports: [
        NgAbilityModule.withAbilities([ArticleAbility, CommentAbility]),
      ],
    }),
    withContextAndAbilities: () => ({
      imports: [
        NgAbilityModule.withAbilities(TestContext, [
          ArticleAbility,
          CommentAbility,
        ]),
      ],
    }),
    withAdditionalAbilitiesFromSubmodule: () => ({
      imports: [
        NgAbilityModule.withAbilities(TestContext, [
          ArticleAbility,
          CommentAbility,
        ]),
        PostSubModule,
      ],
    }),
  },
])(
  '$name',
  ({
    withAbilitiesOnly,
    withContextAndAbilities,
    withAdditionalAbilitiesFromSubmodule,
  }) => {
    describe('with abilities only', () => {
      beforeEach(() => TestBed.configureTestingModule(withAbilitiesOnly()));

      it('should provide abilities via the ABILITY token', () => {
        const abilities = TestBed.inject(ABILITY);
        expect(abilities).toHaveLength(2);
      });

      it('should use null context when no context is provided', () => {
        const context = TestBed.inject(ABILITY_CONTEXT);
        expect(context.abilityContext()).toBeNull();
      });

      it('should resolve abilities through NgAbilityService', () => {
        const service = TestBed.inject(NgAbilityService);
        expect(service.can('Article', 'create')).toBe(true);
        expect(service.can('Comment', 'create')).toBe(false);
      });
    });

    describe('with context and abilities', () => {
      beforeEach(() =>
        TestBed.configureTestingModule(withContextAndAbilities()),
      );

      it('should provide the context via ABILITY_CONTEXT token', () => {
        const context = TestBed.inject(ABILITY_CONTEXT);
        expect(context.abilityContext()).toEqual({ userId: '42' });
      });

      it('should provide abilities via the ABILITY token', () => {
        const abilities = TestBed.inject(ABILITY);
        expect(abilities).toHaveLength(2);
      });

      it('should pass context to abilities through NgAbilityService', () => {
        const service = TestBed.inject(NgAbilityService);
        service.can('Article', 'edit');

        const articleAbility = TestBed.inject(ABILITY).find(
          (a) => a instanceof ArticleAbility,
        ) as ArticleAbility;
        expect(articleAbility.can).toHaveBeenCalledWith(
          { userId: '42' },
          'edit',
          'Article',
        );
      });
    });

    describe('with additional abilities from submodule', () => {
      beforeEach(() =>
        TestBed.configureTestingModule(withAdditionalAbilitiesFromSubmodule()),
      );

      it('should provide abilities from both root and submodule', () => {
        const abilities = TestBed.inject(ABILITY);
        expect(abilities).toHaveLength(3);
      });

      it('should resolve abilities from the root configuration', () => {
        const service = TestBed.inject(NgAbilityService);
        expect(service.can('Article', 'create')).toBe(true);
        expect(service.can('Comment', 'create')).toBe(false);
      });

      it('should resolve abilities from the submodule', () => {
        const service = TestBed.inject(NgAbilityService);
        expect(service.can('Post', 'create')).toBe(true);
      });

      it('should use the root context for all abilities', () => {
        const service = TestBed.inject(NgAbilityService);
        service.can('Post', 'edit');

        const postAbility = TestBed.inject(ABILITY).find(
          (a) => a instanceof PostAbility,
        ) as PostAbility;
        expect(postAbility.can).toHaveBeenCalledWith(
          { userId: '42' },
          'edit',
          'Post',
        );
      });
    });
  },
);
