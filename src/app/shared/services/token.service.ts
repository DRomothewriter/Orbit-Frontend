import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  logout(): void {
    sessionStorage.removeItem('token');
    return;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (typeof payload.exp === 'number') {
        return payload.exp * 1000 <= Date.now();
      }
      return false;
    } catch {
      return true;
    }
  }

  hasToken(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  setToken(token: string): void {
    sessionStorage.setItem('token', token);
    return;
  }

  getToken(): string {
    const token = sessionStorage.getItem('token') || '';
    return token;
  }
}
