import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { ModalsService } from '../shared/services/modals.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: SocialAuthService,
          useValue: {
            authState: of(null),
            initState: of(false),
            signOut: jasmine.createSpy('signOut'),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render app-create-community-modal at HomeComponent root when openCreateCommunity is triggered', () => {
    const modalsService = TestBed.inject(ModalsService);
    modalsService.openCreateCommunity();
    fixture.detectChanges();

    const directModal = Array.from(fixture.nativeElement.children as HTMLCollection).find(
      (el) => el.tagName.toLowerCase() === 'app-create-community-modal'
    );
    expect(directModal).toBeTruthy();
  });

  it('should keep app-myuser-modal mounted with is-closing state during exit transition before unmounting', (done) => {
    const modalsService = TestBed.inject(ModalsService);
    modalsService.openMyUser({ x: 900, y: 40 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-myuser-modal')).toBeTruthy();

    modalsService.closeMyUser();
    fixture.detectChanges();

    expect(component.isMyUserClosing).toBeTrue();
    expect(fixture.nativeElement.querySelector('app-myuser-modal')).toBeTruthy();

    setTimeout(() => {
      fixture.detectChanges();
      expect(component.isMyUserClosing).toBeFalse();
      expect(fixture.nativeElement.querySelector('app-myuser-modal')).toBeFalsy();
      done();
    }, 240);
  });

  describe('Video call modal bounds and resize constraints', () => {
    it('should clamp modal position within viewport when dragging', () => {
      component.modalWidth = 600;
      component.modalHeight = 400;
      component.modalLeft = 100;
      component.modalTop = 100;

      component.startDrag({ clientX: 150, clientY: 120 } as MouseEvent);
      component.onDragMove({ clientX: -500, clientY: -500 } as MouseEvent);
      expect(component.modalLeft).toBeGreaterThanOrEqual(0);
      expect(component.modalTop).toBeGreaterThanOrEqual(0);

      component.onDragMove({ clientX: 99999, clientY: 99999 } as MouseEvent);
      expect(component.modalLeft + component.modalWidth).toBeLessThanOrEqual(window.innerWidth);
      expect(component.modalTop + component.modalHeight).toBeLessThanOrEqual(window.innerHeight);

      component.stopDrag();
    });

    it('should enforce minimum modal size (360x320) when resizing', () => {
      component.modalLeft = 100;
      component.modalTop = 100;
      component.modalWidth = 600;
      component.modalHeight = 400;

      component.startResize({ clientX: 700, clientY: 500, stopPropagation: () => {} } as unknown as MouseEvent, 'bottom-right');
      component.onResizeMove({ clientX: 150, clientY: 150 } as MouseEvent);

      expect(component.modalWidth).toBeGreaterThanOrEqual(360);
      expect(component.modalHeight).toBeGreaterThanOrEqual(320);
      component.stopResize();
    });

    it('should prevent modal from overflowing viewport edges when resizing from top-left or bottom-right', () => {
      component.modalLeft = 50;
      component.modalTop = 50;
      component.modalWidth = 500;
      component.modalHeight = 400;

      component.startResize({ clientX: 50, clientY: 50, stopPropagation: () => {} } as unknown as MouseEvent, 'top-left');
      component.onResizeMove({ clientX: -300, clientY: -300 } as MouseEvent);
      expect(component.modalLeft).toBeGreaterThanOrEqual(0);
      expect(component.modalTop).toBeGreaterThanOrEqual(0);
      component.stopResize();

      component.startResize({ clientX: 550, clientY: 450, stopPropagation: () => {} } as unknown as MouseEvent, 'bottom-right');
      component.onResizeMove({ clientX: 99999, clientY: 99999 } as MouseEvent);
      expect(component.modalLeft + component.modalWidth).toBeLessThanOrEqual(window.innerWidth);
      expect(component.modalTop + component.modalHeight).toBeLessThanOrEqual(window.innerHeight);
      component.stopResize();
    });

    it('should keep modal inside viewport on window resize', () => {
      component.modalWidth = 600;
      component.modalHeight = 400;
      component.modalLeft = window.innerWidth + 200;
      component.modalTop = window.innerHeight + 200;

      window.dispatchEvent(new Event('resize'));

      expect(component.modalLeft).toBeGreaterThanOrEqual(0);
      expect(component.modalTop).toBeGreaterThanOrEqual(0);
      expect(component.modalLeft + component.modalWidth).toBeLessThanOrEqual(window.innerWidth);
      expect(component.modalTop + component.modalHeight).toBeLessThanOrEqual(window.innerHeight);
    });

    it('should prevent default text selection when starting drag or resize and track interaction state', () => {
      const dragPreventDefault = jasmine.createSpy('preventDefault');
      component.startDrag({
        clientX: 100,
        clientY: 100,
        preventDefault: dragPreventDefault,
      } as unknown as MouseEvent);
      expect(dragPreventDefault).toHaveBeenCalled();
      expect(component.isDragging).toBeTrue();
      component.stopDrag();
      expect(component.isDragging).toBeFalse();

      const resizePreventDefault = jasmine.createSpy('preventDefault');
      component.startResize(
        {
          clientX: 200,
          clientY: 200,
          stopPropagation: () => {},
          preventDefault: resizePreventDefault,
        } as unknown as MouseEvent,
        'bottom-right'
      );
      expect(resizePreventDefault).toHaveBeenCalled();
      expect(component.isResizing).toBeTrue();
      component.stopResize();
      expect(component.isResizing).toBeFalse();
    });
  });
});
