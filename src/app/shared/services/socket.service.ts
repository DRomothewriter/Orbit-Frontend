import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Message } from '../types/message';
import { TokenService } from './token.service';
import { GroupService } from './group.service';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  //Confía porque se inicializará en connectWithGroups
  private socket!: Socket;
  constructor(private tokenService: TokenService, private groupService: GroupService) { }

  connectWithGroups() {
    this.groupService.getMyGroups().subscribe(groups => {
      const groupIds = groups.map(g => g.id);
      this.socket = io(environment.apiUrl, {
        auth: {
          token: this.tokenService.getToken()
        },
        query: {
          groupIds: JSON.stringify(groupIds),
          //communitiesIds
          //user
        }
      })
    })
  }
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

  //onFriendrequest
  //onCall

}
