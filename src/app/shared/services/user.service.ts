import { Injectable } from '@angular/core';
import { User } from '../types/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { Friendship } from '../types/friendship';
import { AcceptfrResponse } from '../types/acceptfr-response';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpnt: string = 'users/';

  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}

  getCleanUser(): User {
    return {
      username: '',
      email: '',
    };
  }

  getMyUser(): Observable<User> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<User>(`${environment.apiUrl}${this.endpnt}`, {
      headers,
    });
  };

  getRequestsReceived(): Observable<Friendship[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<Friendship[]>(`${environment.apiUrl}${this.endpnt}received-requests`, {headers});
  };
  
  sendFriendRequest(friendId: string): Observable<Friendship> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<Friendship>(
      `${environment.apiUrl}${this.endpnt}friend-request`,
      { friendId },
      { headers }
    );
  };
  
  acceptFriendRequest(friendshipId: string): Observable<AcceptfrResponse>{
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.put<AcceptfrResponse>(`${environment.apiUrl}${this.endpnt}accept-friend`, { headers, body: {friendshipId}});
  };
  
  getMyFriends(): Observable<Friendship[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<Friendship[]>(`${environment.apiUrl}${this.endpnt}friends`, {headers});
  };

  deleteFriendship(friendshipId: string): Observable<Friendship>{
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<Friendship>(`${environment.apiUrl}${this.endpnt}delete-friendship`, {headers, body: {friendshipId}});
  };

  //blockFriend
  //muteFriend
  //update
  //getUserById
  
};
