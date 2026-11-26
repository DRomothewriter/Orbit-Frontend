import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { LoginComponent } from './auth/login/login.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('appConfig providers', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        appConfig.providers,
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should provide SocialAuthService to resolve NG0201 injector error', () => {
    const socialAuthService = TestBed.inject(SocialAuthService);
    expect(socialAuthService).toBeTruthy();
  });

  it('should instantiate LoginComponent without NG0201 injector error', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
