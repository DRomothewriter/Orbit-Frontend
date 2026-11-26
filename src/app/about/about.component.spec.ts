import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';
import { TokenService } from '../shared/services/token.service';
import { ThemeService } from '../shared/services/theme.service';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let mockTokenService: { hasToken: jasmine.Spy };

  const setup = async (hasToken: boolean) => {
    mockTokenService = {
      hasToken: jasmine.createSpy('hasToken').and.returnValue(hasToken),
    };

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        provideRouter([]),
        { provide: TokenService, useValue: mockTokenService },
        ThemeService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create AboutComponent and render Orbit hero presentation', async () => {
    await setup(false);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain('Orbit');
    expect(compiled.querySelectorAll('.feature-card').length).toBeGreaterThanOrEqual(4);
  });

  it('should show login and register CTAs when user is not authenticated', async () => {
    await setup(false);
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    );

    expect(links).toContain('/login');
    expect(links).toContain('/register');
    expect(links).not.toContain('/home');
  });

  it('should show workspace CTA when user is authenticated', async () => {
    await setup(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    );

    expect(links).toContain('/home');
  });

  it('should toggle theme when clicking the theme toggle button', async () => {
    await setup(false);
    const themeService = TestBed.inject(ThemeService);
    const spy = spyOn(themeService, 'toggleTheme');
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('.about-theme-toggle') as HTMLButtonElement;

    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();
    expect(spy).toHaveBeenCalled();
  });
});
