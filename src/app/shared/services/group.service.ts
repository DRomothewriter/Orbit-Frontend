import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../types/group';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { GroupMember } from '../types/group-member';
import { TokenService } from './token.service';
import { DeleteGroupResponse } from '../types/delete-group-response';
import { GetGroupMembersResponse } from '../types/get-group-members-response';
import { ActivatedRoute } from '@angular/router';

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
    private tokenService: TokenService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
  updateGroupSummary(changes: Partial<Group>) {
    this.groupSummary.next({
      ...this.groupSummary.value,
      ...changes,
    });
  }

  getGroupSummary(groupId?: string): Observable<Group> {
    if(!this.groupSummary.value._id && groupId){
      const headers = this.getHeaders();
      this.httpClient.get<Group>(`${environment.apiUrl}${this.endpnt}${groupId}`, {headers}).subscribe({
        next: (group) => {
          this.updateGroupSummary(group)
        }
      })
    }
    return this.groupSummary.asObservable();
  }

  //DMs
  getMyGroups(): Observable<Group[]> {
    const headers = this.getHeaders();
    return this.httpClient
      .get<Group[]>(`${environment.apiUrl}${this.endpnt}my-groups`, { headers })
      .pipe(tap((response) => this.myGroups.next(response)));
  }

  getAllMyGroups(): Observable<Group[]> {
    const headers = this.getHeaders();
    return this.httpClient
      .get<Group[]>(`${environment.apiUrl}${this.endpnt}all-my-groups`, { headers })
  }

  // getMyCommunityGroups
  //Lo ponemos en este service para cambiar el observable myGroups
  getMyCommunityGroups(communityId: string): Observable<Group[]> {
    const headers = this.getHeaders();
    return this.httpClient
      .get<Group[]>(
        `${environment.apiUrl}${this.endpnt}my-community-groups/${communityId}`,
        { headers }
      )
      .pipe(tap((response) => this.myGroups.next(response)));
  }

  getMyGroupMember(groupId: string): Observable<GroupMember> {
    const headers = this.getHeaders();
    return this.httpClient.get<GroupMember>(
      `${environment.apiUrl}${this.endpnt}my-group-member/${groupId}`,
      { headers }
    );
  }

  getGroupMembers(groupId: string): Observable<GetGroupMembersResponse[]> {
    const headers = this.getHeaders();
    return this.httpClient.get<GetGroupMembersResponse[]>(
      `${environment.apiUrl}${this.endpnt}group-members/${groupId}`,
      { headers }
    );
  }

  createGroup(group: Group, friendIds: string[]): Observable<Group> {
    const headers = this.getHeaders();
    return this.httpClient
      .post<Group>(
        `${environment.apiUrl}${this.endpnt}`,
        { group: group, initialMembersIds: friendIds },
        { headers }
      )
      .pipe(
        tap((response) =>
          this.myGroups.next([...this.myGroups.value, response])
        )
      );
  }

  addGroupMembers(
    userIds: string[],
    groupId: string
  ): Observable<GroupMember[]> {
    const headers = this.getHeaders();
    return this.httpClient.post<GroupMember[]>(
      `${environment.apiUrl}${this.endpnt}add-groupmembers`,
      { groupId, userIds },
      { headers }
    );
  }

  editGroupImg(formData: FormData, groupId: string): Observable<string> {
    const headers = this.getHeaders();
    return this.httpClient
      .put<string>(
        `${environment.apiUrl}${this.endpnt}edit-group-image/${groupId}`,
        formData,
        { headers }
      )
      .pipe(
        tap((response) => {
          this.updateGroupSummary({ groupImgUrl: response });
          const updatedGroups = this.myGroups.value.map((group) =>
            group._id === groupId ? { ...group, groupImgUrl: response } : group
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }
  editTopic(topic: string, groupId: string): Observable<string> {
    const headers = this.getHeaders();
    return this.httpClient
      .put<string>(
        `${environment.apiUrl}${this.endpnt}edit-topic/${groupId}`,
        { topic },
        { headers }
      )
      .pipe(
        tap((response) => {
          this.updateGroupSummary({ topic: response });
          const updatedGroups = this.myGroups.value.map((group) =>
            group._id === groupId ? { ...group, topic: response } : group
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }
  makeGroupAdmin(
    groupMemberId: string,
    groupId: string
  ): Observable<GroupMember> {
    const headers = this.getHeaders();
    return this.httpClient.put<GroupMember>(
      `${environment.apiUrl}${this.endpnt}${groupId}/make-admin/${groupMemberId}`,
      {},
      { headers }
    );
  }

  removeGroupMember(
    groupMemberId: string,
    groupId: string
  ): Observable<GroupMember> {
    const headers = this.getHeaders();
    return this.httpClient.delete<GroupMember>(
      `${environment.apiUrl}${this.endpnt}${groupId}/remove-member/${groupMemberId}`,
      { headers }
    );
  }

  deleteGroup(groupId: string): Observable<DeleteGroupResponse> {
    const headers = this.getHeaders();
    return this.httpClient
      .delete<DeleteGroupResponse>(
        `${environment.apiUrl}${this.endpnt}${groupId}`,
        { headers }
      )
      .pipe(
        tap(() => {
          const updatedGroups = this.myGroups.value.filter(
            (g) => g._id !== groupId
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }

  leaveGroup(groupId: string): Observable<GroupMember> {
    const headers = this.getHeaders();
    return this.httpClient
      .delete<GroupMember>(
        `${environment.apiUrl}${this.endpnt}${groupId}leave-group`,
        { headers }
      )
      .pipe(
        tap(() => {
          const updatedGroups = this.myGroups.value.filter(
            (g) => g._id !== groupId
          );
          this.myGroups.next(updatedGroups);
        })
      );
  }

  //Funcion de respuesta para cuando nos agregar a un grupo y estamos online (socket)
}
