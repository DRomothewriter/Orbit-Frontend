import { TestBed } from '@angular/core/testing';

import { ModalsService, ModalAnchor } from './modals.service';

describe('ModalsService', () => {
  let service: ModalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit openMyUser$ and myUserAnchor$ when openMyUser is called with an anchor', () => {
    let isOpen = false;
    let anchor: ModalAnchor | null | undefined;

    service.openMyUser$.subscribe((val) => (isOpen = val));
    service.myUserAnchor$.subscribe((val) => (anchor = val));

    service.openMyUser({ x: 940, y: 44 });

    expect(isOpen).toBeTrue();
    expect(anchor).toEqual({ x: 940, y: 44 });

    service.closeMyUser();
    expect(isOpen).toBeFalse();
  });
});
