import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../types/auth-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private endpnt: string = 'auth/'
  constructor(private httpClient: HttpClient) { }


  signup(name: string, email: string, password: string): Observable<AuthResponse>{
    return this.httpClient.post<AuthResponse>(`${environment.apiUrl}${this.endpnt}signup`, {name, email, password});
  };

  login(email: string, password: string): Observable<AuthResponse>{
    return  this.httpClient.post<AuthResponse>(`${environment.apiUrl}${this.endpnt}login`, {email, password});
  }

}
