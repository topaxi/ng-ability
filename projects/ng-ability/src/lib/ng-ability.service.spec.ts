import { TestBed } from '@angular/core/testing';

import { NgAbilityService } from './ng-ability.service';

describe('NgAbilityService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgAbilityService = TestBed.get(NgAbilityService);
    expect(service).toBeTruthy();
  });
});
