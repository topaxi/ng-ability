import { TestBed } from '@angular/core/testing';
import { NgAbilityService } from './ng-ability.service';
import { CanPipe } from './can.pipe';

describe('CanPipe', () => {
  let ngAbilityService: { can: ReturnType<typeof vi.fn> };
  let pipe: CanPipe;

  beforeEach(() => {
    ngAbilityService = { can: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: NgAbilityService, useValue: ngAbilityService },
      ],
    });

    pipe = TestBed.runInInjectionContext(() => new CanPipe());
  });

  it('should call ability service with action and thing', () => {
    ngAbilityService.can.mockReturnValue(true);
    pipe.transform('Article', 'create');
    expect(ngAbilityService.can).toHaveBeenCalledWith('create', 'Article');
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
    expect(ngAbilityService.can).toHaveBeenCalledWith('edit', article);
  });
});
