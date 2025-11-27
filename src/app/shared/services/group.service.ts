import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../types/group';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { GroupMember } from '../types/group-member';
import { TokenService } from './token.service';
import { DeleteGroupResponse } from '../types/delete-group-response';
import { GetGroupMembersResponse } from '../types/get-group-members-response';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private endpnt: string = 'groups/';
  private groupSummary = new BehaviorSubject<Group>({ topic: '' });
  private myGroups = new BehaviorSubject<Group[]>([]);
  myGroups$ = this.myGroups.asObservable();

  constructor(
    private httpClient: HttpClient,
    private tokenService: TokenService
  ) {}
  
  updateGroupSummary(changes: Partial<Group>) {
    this.groupSummary.next({
      ...this.groupSummary.value,
      ...changes,
    });
  }

  getGroupSummary(): Observable<Group> {
    return this.groupSummary.asObservable();
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

  getGroupMembers(groupId: string): Observable<GetGroupMembersResponse[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<GetGroupMembersResponse[]>(
      `${environment.apiUrl}${this.endpnt}group-members/${groupId}`,
      { headers }
    );
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

  addGroupMembers(userIds: string[], groupId: string): Observable<GroupMember[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<GroupMember[]>(
      `${environment.apiUrl}${this.endpnt}add-groupmembers`,
      { groupId, userIds },
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
          this.updateGroupSummary({groupImgUrl: response});
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
          this.updateGroupSummary({topic: response});
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
