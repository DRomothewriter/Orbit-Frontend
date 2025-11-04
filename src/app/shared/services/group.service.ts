import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../types/group';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { GroupMember } from '../types/group-member';
import { TokenService } from './token.service';
import { DeleteGroupResponse } from '../types/delete-group-response';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private endpnt: string = 'groups/';
  constructor(private httpClient: HttpClient, private tokenService: TokenService) {}

  getMyGroups(): Observable<Group[]> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<Group[]>(
      `${environment.apiUrl}${this.endpnt}my-groups`, {headers}
    );
  }

  createGroup(group: Group): Observable<Group> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<Group>(`${environment.apiUrl}${this.endpnt}`, 
      { group: group }, {headers},);
  }

  addGroupMember(userId: string, groupId: string): Observable<GroupMember> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.post<GroupMember>(
      `${environment.apiUrl}${this.endpnt}`,
      { groupId, userId }
    );
  }

  deleteGroup(groupId: string): Observable<DeleteGroupResponse>{
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<DeleteGroupResponse>(
      `${environment.apiUrl}${this.endpnt}${groupId}`,
      {headers}
    );
  };

  leaveGroup(groupId: string, userId: string): Observable<GroupMember>{
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.delete<GroupMember>(`${environment.apiUrl}${this.endpnt}${groupId}remove-member/${userId}`, {headers})
  };
};
