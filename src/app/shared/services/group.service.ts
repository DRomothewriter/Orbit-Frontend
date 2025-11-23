import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../types/group';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { GroupMember } from '../types/group-member';
import { TokenService } from './token.service';
import { DeleteGroupResponse } from '../types/delete-group-response';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private endpnt: string = 'groups/';
  private topic = new BehaviorSubject<string>('');
  private groupImgUrl = new BehaviorSubject<string>('');
  private myGroups = new BehaviorSubject<Group[]>([]);
  myGroups$ = this.myGroups.asObservable(); 
  
  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}

  getTopic(): Observable<string> {
    return this.topic;
  }
  setTopic(topic: string): void {
    this.topic.next(topic);
  }
  getGroupImgUrl(): Observable<string> {
    return this.groupImgUrl;
  }
  setGroupImgUrl(groupImgUrl: string): void {
    this.groupImgUrl.next(groupImgUrl);
  }

  getMyGroups(): Observable<Group[]> {
    if (this.myGroups.value.length > 0) return this.myGroups;
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .get<Group[]>(`${environment.apiUrl}${this.endpnt}my-groups`, { headers })
      .pipe(tap((response) => this.myGroups.next(response)));
  }

  createGroup(group: Group, friendIds: string[]): Observable<Group> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<Group>(
      `${environment.apiUrl}${this.endpnt}`,
      { group: group, initialMembersIds: friendIds },
      { headers }
    );
  }

  addGroupMember(userId: string, groupId: string): Observable<GroupMember> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<GroupMember>(
      `${environment.apiUrl}${this.endpnt}`,
      { groupId, userId },
      { headers }
    );
  }

  editGroupImg(formData: FormData, groupId: string): Observable<string> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .put<string>(
        `${environment.apiUrl}${this.endpnt}edit-group-image/${groupId}`,
        formData,
        { headers }
      )
      .pipe(
        tap((response) => {
          this.setGroupImgUrl(response);
          const updatedGroups = this.myGroups.value.map((group) =>
            group._id === groupId ? { ...group, groupImgUrl: response } : group
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }
  editTopic(topic: string, groupId: string): Observable<string> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient
      .put<string>(
        `${environment.apiUrl}${this.endpnt}edit-topic/${groupId}`,
        { topic },
        { headers }
      )
      .pipe(
        tap((response) => {
          this.setTopic(response);
          const updatedGroups = this.myGroups.value.map((group) =>
            group._id === groupId ? { ...group, topic: response } : group
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }
  deleteGroup(groupId: string): Observable<DeleteGroupResponse> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<DeleteGroupResponse>(
      `${environment.apiUrl}${this.endpnt}${groupId}`,
      { headers }
    );
  }

  leaveGroup(groupId: string, userId: string): Observable<GroupMember> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<GroupMember>(
      `${environment.apiUrl}${this.endpnt}${groupId}remove-member/${userId}`,
      { headers }
    );
  }
}
