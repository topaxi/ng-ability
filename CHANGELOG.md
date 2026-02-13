# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [2.2.0](https://github.com/topaxi/ng-ability/compare/v2.1.0...v2.2.0) (2026-02-13)


### Features

* route guards ([3eec8c5](https://github.com/topaxi/ng-ability/commit/3eec8c5d7bff3996e1f346e6abd5f0eaed1c79fe))

## [2.1.0](https://github.com/topaxi/ng-ability/compare/v2.0.1...v2.1.0) (2026-02-12)


### Features

* add global abilities with type-safe enforcement ([d773d3a](https://github.com/topaxi/ng-ability/commit/d773d3a53de81e58aacb5ad17a1a567a96ec9e2a))

## [2.0.1](https://github.com/topaxi/ng-ability/compare/v2.0.0...v2.0.1) (2026-02-12)

## [2.0.0](https://github.com/topaxi/ng-ability/compare/v0.1.2...v2.0.0) (2026-02-12)


### ⚠ BREAKING CHANGES

* The can() method signature has changed from can(action, thing) to can(matcher, action, thing). All calls to this method must be updated to use the new argument order. Additionally, the AbilityContext interface now uses Signal<S> instead of a getAbilityContext() method.
* **directive:** The CanDirective now uses signal-based inputs (input()) instead of @Input() decorators and uses effect() instead of ngDoCheck() for change detection. This is part of Angular 21's signal-based architecture.
* The [can] directive input array order has changed from [action, thing] to [matcher, action, thing] to align with the new service API.
* **deps:** This library now requires Angular 21 as a peer dependency. You must upgrade your Angular application to version 21 before using this version.

* **deps:** upgrade to Angular 21 and migrate project structure ([f42e6a0](https://github.com/topaxi/ng-ability/commit/f42e6a00b16ef562eee45a0eb133c83f69eff031))
* **directive:** modernize can directive implementation ([2bbd277](https://github.com/topaxi/ng-ability/commit/2bbd277605bb349dfa5476b35130f07c54a1d8f1))
* update all core files for Angular 21 compatibility ([8afac2c](https://github.com/topaxi/ng-ability/commit/8afac2c31948852e5a3960199e62446574b9199f))


### Features

* add can pipe for template usage ([00c2593](https://github.com/topaxi/ng-ability/commit/00c25932fda6a2fffa8f7cc1b52125ca1ab423a9))
* add ng-ability tokens for dependency injection ([f371010](https://github.com/topaxi/ng-ability/commit/f371010bdc3ee0be8a6c798acec7831243afaf9c))
* enhance can directive and pipe with type-safe interfaces ([cc0ce1f](https://github.com/topaxi/ng-ability/commit/cc0ce1f74a637b2e2fa82c04717b4c66b8d41b02))
* enhance directive, pipe, and service with improved testing ([78f6a07](https://github.com/topaxi/ng-ability/commit/78f6a0760e83413b9201ba124e5519fdb6ce30d9))
* **interfaces:** add new interface types and functionality ([ad2d9c5](https://github.com/topaxi/ng-ability/commit/ad2d9c503ad6f0d38e8f3854c932b5a900440a27))


### Bug Fixes

* ignore version tags for tests ([b778249](https://github.com/topaxi/ng-ability/commit/b778249d30b13a4e40a7530a21cf0b4eb5b38955))
* NoInfer on action types ([4cfdd52](https://github.com/topaxi/ng-ability/commit/4cfdd52898105aa5db80037bee6d7882f4be314c))
* resolve can pipe and module integration issues ([25c303c](https://github.com/topaxi/ng-ability/commit/25c303c2f5086055cbff37938d59ef39b22221b0))
* update service implementation and build config ([f044f60](https://github.com/topaxi/ng-ability/commit/f044f60214d16ef111dd00211072ef85c2ebbaf4))
