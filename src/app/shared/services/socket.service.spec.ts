import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { SocketService } from './socket.service';
import { TokenService } from './token.service';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { UserStatus } from '../types/user-status';
import { Message } from '../types/message';
import { Group } from '../types/group';
import { Notification } from '../types/notification';

describe('SocketService (TDD - Memory Leak Mitigation)', () => {
  let service: SocketService;
  let mockSocket: {
    on: jasmine.Spy;
    off: jasmine.Spy;
    emit: jasmine.Spy;
    disconnect: jasmine.Spy;
  };

  const mockTokenService = {
    getToken: jasmine.createSpy('getToken').and.returnValue('fake-token'),
  };

  const mockGroupService = {
    getAllMyGroups: jasmine.createSpy('getAllMyGroups').and.returnValue(of([])),
  };

  const mockUserService = {
    getCleanUser: jasmine.createSpy('getCleanUser').and.returnValue({
      _id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
    }),
    getMyUser: jasmine.createSpy('getMyUser').and.returnValue(
      of({
        _id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      })
    ),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SocketService,
        { provide: TokenService, useValue: mockTokenService },
        { provide: GroupService, useValue: mockGroupService },
        { provide: UserService, useValue: mockUserService },
      ],
    });

    service = TestBed.inject(SocketService);

    mockSocket = {
      on: jasmine.createSpy('on'),
      off: jasmine.createSpy('off'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
    };

    (service as any).socket = mockSocket;
    (service as any).socketReady = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('onMessage', () => {
    it('should register listener on subscribe and emit received messages', () => {
      let receivedMessage: Message | undefined;
      const sub = service.onMessage().subscribe((msg) => {
        receivedMessage = msg;
      });

      expect(mockSocket.on).toHaveBeenCalledWith('message', jasmine.any(Function));
      const handler = mockSocket.on.calls.mostRecent().args[1];

      const testMsg: Message = {
        _id: 'm1',
        username: 'testuser',
        userId: 'u1',
        groupId: 'g1',
        type: 'text' as any,
        text: 'Hello World',
        createdAt: new Date().toISOString(),
      };
      handler(testMsg);

      expect(receivedMessage).toEqual(testMsg);
      sub.unsubscribe();
    });

    it('should unregister listener with socket.off when unsubscribing', () => {
      const sub = service.onMessage().subscribe();
      expect(mockSocket.on).toHaveBeenCalledWith('message', jasmine.any(Function));
      const registeredHandler = mockSocket.on.calls.mostRecent().args[1];

      sub.unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('message', registeredHandler);
    });
  });

  describe('onCall', () => {
    it('should register call-starting listener and extract group payload', () => {
      let receivedGroup: Group | undefined;
      const sub = service.onCall().subscribe((group) => {
        receivedGroup = group;
      });

      expect(mockSocket.on).toHaveBeenCalledWith('call-starting', jasmine.any(Function));
      const handler = mockSocket.on.calls.mostRecent().args[1];

      const testGroup: Group = {
        _id: 'g1',
        topic: 'General',
      } as Group;

      handler({ group: testGroup });
      expect(receivedGroup).toEqual(testGroup);
      sub.unsubscribe();
    });

    it('should unregister call-starting listener with socket.off when unsubscribing', () => {
      const sub = service.onCall().subscribe();
      expect(mockSocket.on).toHaveBeenCalledWith('call-starting', jasmine.any(Function));
      const registeredHandler = mockSocket.on.calls.mostRecent().args[1];

      sub.unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('call-starting', registeredHandler);
    });
  });

  describe('onNotification', () => {
    it('should register notification listener and unregister with socket.off when unsubscribing', () => {
      const sub = service.onNotification().subscribe();
      expect(mockSocket.on).toHaveBeenCalledWith('notification', jasmine.any(Function));
      const registeredHandler = mockSocket.on.calls.mostRecent().args[1];

      sub.unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('notification', registeredHandler);
    });
  });

  describe('onFriendStatusChange', () => {
    it('should register friend-status-change listener and unregister with socket.off when unsubscribing', () => {
      const sub = service.onFriendStatusChange().subscribe();
      expect(mockSocket.on).toHaveBeenCalledWith(
        'friend-status-change',
        jasmine.any(Function)
      );
      const registeredHandler = mockSocket.on.calls.mostRecent().args[1];

      sub.unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith(
        'friend-status-change',
        registeredHandler
      );
    });
  });

  describe('Premature Unsubscribe / Timeout cleanup', () => {
    it('should cancel pending polling timeout and not register listener if unsubscribed before socket is ready', fakeAsync(() => {
      (service as any).socketReady = false;

      const sub = service.onMessage().subscribe();
      expect(mockSocket.on).not.toHaveBeenCalled();

      // Unsubscribe before socket connects/becomes ready
      sub.unsubscribe();

      // Simulate socket becoming ready later and time passing
      (service as any).socketReady = true;
      tick(500);

      // Listener must never have been registered on the socket
      expect(mockSocket.on).not.toHaveBeenCalled();
    }));
  });
});
