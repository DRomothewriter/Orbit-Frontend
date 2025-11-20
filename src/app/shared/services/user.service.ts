import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { User } from '../types/user';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { Friendship } from '../types/friendship';
import { AcceptfrResponse } from '../types/acceptfr-response';

import { Observable, tap } from 'rxjs';
import { GetFriendsResponse } from '../types/get-friends-response';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpnt: string = 'users/';
  private user: User | null = null;

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
  setUser(user: User) {
    this.user = user;
    return;
  }
  clearUser() {
    this.user = null;
  }

  getMyUser(): Observable<User> {
    if (this.user?._id){
      return new Observable<User>((observer) => {
        observer.next(this.user as User);
        observer.complete();
      });
    }
    const token = this.tokenService.getToken();
    console.log(token)
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .get<User>(`${environment.apiUrl}${this.endpnt}my-user`, {
        headers,
      })
      .pipe(tap((user) => (this.user = user)));
    //Para guardarlo en user. Es como un cahceo
  }

  getAllUsers(): Observable<User[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<User[]>(`${environment.apiUrl}${this.endpnt}`, {
      headers,
    });
  }

  getRequestsReceived(): Observable<Friendship[]> {
    const token = this.tokenService.getToken();
    console.log(token)
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<Friendship[]>(
      `${environment.apiUrl}${this.endpnt}received-requests`,
      { headers }
    );
  }

  searchUsers(searchQuery: string): Observable<User[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<User[]>(
      `${environment.apiUrl}${this.endpnt}search?username=${searchQuery}`,
      { headers }
    );
  }
  sendFriendRequest(friendId: string): Observable<Friendship> {
    console.log(friendId);
    console.log(this.user);
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<Friendship>(
      `${environment.apiUrl}${this.endpnt}friend-request`,
      { friendId },
      { headers }
    );
  }

  acceptFriendRequest(friendshipId: string): Observable<AcceptfrResponse> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.put<AcceptfrResponse>(
      `${environment.apiUrl}${this.endpnt}accept-friend`,
      { friendshipId },
      { headers }
    );
  }

  //Falta hacer que el backend regrese también el username del friend
  getMyFriends(): Observable<GetFriendsResponse[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<GetFriendsResponse[]>(
      `${environment.apiUrl}${this.endpnt}friends`,
      { headers }
    );
  }

  deleteFriendship(friendshipId: string): Observable<Friendship> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<Friendship>(
      `${environment.apiUrl}${this.endpnt}delete-friendship`,
      { headers, body: { friendshipId } }
    );
  }

  //blockFriend
  //muteFriend
  //update
  //getUserById
}
