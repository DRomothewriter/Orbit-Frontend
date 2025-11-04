import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  logout(): void{
    localStorage.setItem('token', '');
    return;
  }

  hasToken(): boolean{
    return !!localStorage.getItem('token');
  }

  setToken(token: string): void{
    localStorage.setItem('token', token);
    return;
  }

  getToken():string{
    const token = localStorage.getItem('token') || '';
    return token;
  }
}
