import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { ModalsService } from '../../shared/services/modals.service';
import { UserService } from '../../shared/services/user.service';
import { TokenService } from '../../shared/services/token.service';
import { NotificationsService } from '../../shared/services/notifications.service';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';

describe('HeaderComponent (TDD - Ticket Orbit-0009)', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const mockModalsService = {
    openCalendar: jasmine.createSpy('openCalendar'),
    openMyUser: jasmine.createSpy('openMyUser'),
  };

  const mockUserService = {
    getCleanUser: () => ({
      _id: 'u1',
      username: 'TestUser',
      email: 'test@example.com',
    }),
    currentUser$: of({
      _id: 'u1',
      username: 'TestUser',
      email: 'test@example.com',
    }),
    clearUser: jasmine.createSpy('clearUser'),
  };

  const mockTokenService = {
    logout: jasmine.createSpy('logout'),
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
  };

  const mockSocialAuthService = {
    signOut: jasmine.createSpy('signOut'),
  };

  const mockNotificationsService = {
    currentNotifications$: of([]),
    getMyUnseenNotifications: () => of([]),
    updateToSeen: () => of([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: ModalsService, useValue: mockModalsService },
        { provide: UserService, useValue: mockUserService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: mockRouter },
        { provide: SocialAuthService, useValue: mockSocialAuthService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create HeaderComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT render the calendar button in the header (Orbit-0009 DoD)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const calendarTooltipBtn = compiled.querySelector('button[matTooltip="Calendario"]');
    const calendarIcon = Array.from(
      compiled.querySelectorAll('.nav-icon mat-icon')
    ).find((el) => el.textContent?.trim() === 'calendar_month');

    expect(calendarTooltipBtn).toBeFalsy();
    expect(calendarIcon).toBeFalsy();
  });

  it('should preserve notifications button in navbar-menu', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const notificationsIcon = Array.from(
      compiled.querySelectorAll('.nav-icon mat-icon')
    ).find((el) => el.textContent?.trim() === 'notifications');

    expect(notificationsIcon).toBeTruthy();
  });
});
