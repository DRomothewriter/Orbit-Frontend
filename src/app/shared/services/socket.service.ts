import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Message } from '../types/message';
import { TokenService } from './token.service';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { User } from '../types/user';

import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Group } from '../types/group';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  //Confía porque se inicializará en connectWithGroups
  private socket!: Socket;
  private user: User;
  constructor(private tokenService: TokenService, private groupService: GroupService, private userService: UserService) {
    this.user = userService.getCleanUser();
  }

  connectWithGroups() {
    this.userService.getMyUser().subscribe({
      next: (user) => {

        this.user = user;
        this.groupService.getMyGroups().subscribe({

          next: (myGroups: Group[]) => {
          const groupIds = myGroups.map(g => g._id);
          this.socket = io(environment.apiUrl, {
            auth: {
              token: this.tokenService.getToken()
            },
            query: {
              groupIds: JSON.stringify(groupIds),
              //communitiesIds
              user: JSON.stringify(this.user)
            }
          });
        }
      });
        
      }
    });
  };
  
  disconnect() {
    if(this.socket){
      this.socket.disconnect();
    }
  }
  onMessage(): Observable<Message>{
    return new Observable(observer => {
      this.socket.on('message', (data: Message)=> {
        observer.next(data);
      });
    });
  };

  onNotification(): Observable<Notification>{
    return new Observable(observer => {
      this.socket.on('notification', (data: Notification) => {
        observer.next(data);
      });
    });
  };

  //onCall

}
