import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { of } from 'rxjs';

import { MyuserModalComponent } from './myuser-modal.component';

describe('MyuserModalComponent', () => {
  let component: MyuserModalComponent;
  let fixture: ComponentFixture<MyuserModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyuserModalComponent],
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

    fixture = TestBed.createComponent(MyuserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should position modal-content immediately near the click anchor without overflowing viewport', () => {
    component.anchor = { x: window.innerWidth - 30, y: 40 };
    component.ngOnChanges();
    fixture.detectChanges();

    const modalContent = fixture.nativeElement.querySelector('.modal-content') as HTMLElement;
    expect(modalContent).toBeTruthy();
    const expectedTop = Math.round(Math.max(12, Math.min(52, window.innerHeight - 400 - 12)));
    expect(modalContent.style.top).toBe(`${expectedTop}px`);
    const leftVal = parseFloat(modalContent.style.left);
    expect(leftVal).toBeGreaterThanOrEqual(12);
    expect(leftVal + 380).toBeLessThanOrEqual(window.innerWidth);
  });

  it('should apply is-closing class to overlay and content when isClosing is true', () => {
    component.isClosing = true;
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    const modalContent = fixture.nativeElement.querySelector('.modal-content') as HTMLElement;
    expect(overlay.classList.contains('is-closing')).toBeTrue();
    expect(modalContent.classList.contains('is-closing')).toBeTrue();
  });
});
