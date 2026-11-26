import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Message } from '../types/message';
import { TokenService } from './token.service';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { User } from '../types/user';
import { UserStatus } from '../types/user-status';

import { io, Socket } from 'socket.io-client';
import { Observable, take } from 'rxjs';
import { Group } from '../types/group';
import { Notification } from '../types/notification';

interface ActiveListener {
  eventName: string;
  handler: (data: any) => void;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private user: User;
  private socketReady = false;
  private activeListeners = new Set<ActiveListener>();

  constructor(
    private tokenService: TokenService,
    private groupService: GroupService,
    private userService: UserService
  ) {
    this.user = userService.getCleanUser();
  }

  connectWithGroups() {
    this.userService
      .getMyUser()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.groupService
            .getAllMyGroups()
            .pipe(take(1))
            .subscribe({
              next: (allMyGroups: Group[]) => {
                this.disconnect();
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
                  this.activeListeners.forEach(({ eventName, handler }) => {
                    this.socket.off(eventName, handler);
                    this.socket.on(eventName, handler);
                  });
                  console.log('Socket connected');
                });
                this.socket.on('disconnect', () => {
                  this.socketReady = false;
                });
              },
            });
        },
      });
  }

  disconnect() {
    this.socketReady = false;
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
      let attachedSocket: Socket | undefined;

      const handler = (data: T) => {
        const result = transform ? transform(data) : (data as unknown as R);
        observer.next(result);
      };

      const listenerEntry: ActiveListener = { eventName, handler };
      this.activeListeners.add(listenerEntry);

      const checkSocket = () => {
        if (!isSubscribed) return;
        if (this.socket && this.socketReady) {
          attachedSocket = this.socket;
          this.socket.off(eventName, handler);
          this.socket.on(eventName, handler);
        } else {
          timeoutId = setTimeout(checkSocket, pollInterval);
        }
      };

      checkSocket();

      return () => {
        isSubscribed = false;
        this.activeListeners.delete(listenerEntry);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const targetSocket = attachedSocket || this.socket;
        if (targetSocket) {
          targetSocket.off(eventName, handler);
        }
      };
    });
  }

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
