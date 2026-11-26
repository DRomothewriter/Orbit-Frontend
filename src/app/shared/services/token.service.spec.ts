import { TestBed } from '@angular/core/testing';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for hasToken() when JWT is expired', () => {
    const expiredPayload = btoa(
      JSON.stringify({ id: 'u1', exp: Math.floor(Date.now() / 1000) - 60 })
    );
    const expiredToken = `header.${expiredPayload}.sig`;
    service.setToken(expiredToken);

    expect(service.hasToken()).toBeFalse();
  });

  it('should return true for hasToken() when JWT is valid and not expired', () => {
    const validPayload = btoa(
      JSON.stringify({ id: 'u1', exp: Math.floor(Date.now() / 1000) + 3600 })
    );
    const validToken = `header.${validPayload}.sig`;
    service.setToken(validToken);

    expect(service.hasToken()).toBeTrue();
    service.logout();
  });
});
