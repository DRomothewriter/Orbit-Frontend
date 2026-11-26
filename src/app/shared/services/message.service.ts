import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { Message } from '../types/message';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private endpnt: string = 'messages/';
  private sentMessageSubject = new Subject<Message>();
  sentMessage$ = this.sentMessageSubject.asObservable();

  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}

  sendMessage(message: Message): Observable<any> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .post<any>(
        `${environment.apiUrl}${this.endpnt}`,
        { message: message },
        { headers }
      )
      .pipe(
        tap((res) => {
          const created = res?.newMessage ?? res;
          if (created && created.groupId) {
            this.sentMessageSubject.next(created);
          }
        })
      );
  }

  sendImageMessage(formData: FormData): Observable<any> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .post<any>(`${environment.apiUrl}messages/image`, formData, { headers })
      .pipe(
        tap((res) => {
          const created = res?.newMessage ?? res;
          if (created && created.groupId) {
            this.sentMessageSubject.next(created);
          }
        })
      );
  }

  getGroupMessages(groupId: string): Observable<Message[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<Message[]>(
      `${environment.apiUrl}${this.endpnt}groupMessages/${groupId}`,
      { headers }
    );
  }
}
