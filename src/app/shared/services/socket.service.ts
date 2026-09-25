import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Message } from '../types/message';
import { TokenService } from './token.service';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { User } from '../types/user';
import { UserStatus } from '../types/user-status'; // Importar enum

import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Group } from '../types/group';
import { Notification } from '../types/notification';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private user: User;
  private socketReady = false;

  constructor(
    private tokenService: TokenService,
    private groupService: GroupService,
    private userService: UserService
  ) {
    this.user = userService.getCleanUser();
  }

  connectWithGroups() {
    this.userService.getMyUser().subscribe({
      next: (user) => {
        this.user = user;
        this.groupService.getAllMyGroups().subscribe({
          next: (allMyGroups: Group[]) => {
            const groupIds = allMyGroups.map((g) => g._id);
            this.socket = io(environment.apiUrl, {
              auth: {
                token: this.tokenService.getToken(),
              },
              query: {
                groupIds: JSON.stringify(groupIds),
                user: JSON.stringify(this.user),
              },
            });
            this.socket.on('connect', () => {
              this.socketReady = true;
              console.log('Socket connected');
            });
          },
        });
      },
    });
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  getSocket(): Socket {
    return this.socket;
  }

  private createSocketListener<T, R = T>(
    eventName: string,
    transform?: (data: T) => R,
    pollInterval = 100
  ): Observable<R> {
    return new Observable<R>((observer) => {
      let isSubscribed = true;
      let timeoutId: any;

      const handler = (data: T) => {
        const result = transform ? transform(data) : (data as unknown as R);
        observer.next(result);
      };

      const checkSocket = () => {
        if (!isSubscribed) return;
        if (this.socket && this.socketReady) {
          this.socket.on(eventName, handler);
        } else {
          timeoutId = setTimeout(checkSocket, pollInterval);
        }
      };

      checkSocket();

      return () => {
        isSubscribed = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (this.socket) {
          this.socket.off(eventName, handler);
        }
      };
    });
  }

  // === NUEVO: Manejo de Estado === No se si sea necesario
  emitStatusChange(status: UserStatus) {
    if (this.socket && this.socketReady) {
      this.socket.emit('status-change', { status });
    }
  }

  onFriendStatusChange(): Observable<{ userId: string; status: UserStatus }> {
    return this.createSocketListener<{ userId: string; status: UserStatus }>(
      'friend-status-change',
      undefined,
      500
    );
  }
  // ==============================

  onMessage(): Observable<Message> {
    return this.createSocketListener<Message>('message');
  }

  onNotification(): Observable<Notification> {
    return this.createSocketListener<Notification>('notification');
  }

  onCall(): Observable<Group> {
    return this.createSocketListener<{ group: Group }, Group>(
      'call-starting',
      (data) => {
        console.log('🔔 Event call-starting recibido:', data);
        return data.group;
      }
    );
  }
}
