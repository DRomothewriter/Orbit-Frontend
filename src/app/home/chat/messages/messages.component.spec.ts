import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApplicationRef } from '@angular/core';
import { Subject, of } from 'rxjs';

import { MessagesComponent } from './messages.component';
import { MessageService } from '../../../shared/services/message.service';
import { SocketService } from '../../../shared/services/socket.service';
import { UserService } from '../../../shared/services/user.service';
import { Message } from '../../../shared/types/message';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;
  let socketMsg$: Subject<Message>;

  beforeEach(async () => {
    socketMsg$ = new Subject<Message>();

    await TestBed.configureTestingModule({
      imports: [MessagesComponent],
      providers: [
        provideRouter([]),
        {
          provide: MessageService,
          useValue: {
            getGroupMessages: jasmine.createSpy('getGroupMessages').and.returnValue(of([])),
          },
        },
        {
          provide: SocketService,
          useValue: {
            onMessage: () => socketMsg$.asObservable(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getMyUser: () => of({ _id: 'u1', username: 'diego', email: 'd@t.com' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render incoming socket message in DOM without manual click (Angular 22 Eager CD)', () => {
    expect((MessagesComponent as any).ɵcmp.onPush).toBeFalse();
    component.groupId = 'g1';
    socketMsg$.next({
      _id: 'm1',
      groupId: 'g1',
      userId: 'u2',
      username: 'ana',
      type: 'text' as any,
      text: 'Hola en tiempo real',
      createdAt: new Date().toISOString(),
    });

    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.message-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Hola en tiempo real');
  });

  it('should scroll immediately to bottom without setTimeout/smooth when opening a chat', () => {
    const listEl = (fixture.nativeElement as HTMLElement).querySelector('.messages-list') as HTMLElement;
    listEl.style.height = '100px';
    listEl.style.overflowY = 'auto';
    const spacer = document.createElement('div');
    spacer.style.height = '500px';
    spacer.style.flexShrink = '0';
    listEl.appendChild(spacer);
    listEl.scrollTop = 0;

    component.scrollToBottomImmediate();
    expect(listEl.scrollTop).toBeGreaterThan(0);
  });

  it('should re-pin scroll to bottom when media loads near bottom', () => {
    const listEl = (fixture.nativeElement as HTMLElement).querySelector('.messages-list') as HTMLElement;
    listEl.style.height = '100px';
    listEl.style.overflowY = 'auto';
    const spacer = document.createElement('div');
    spacer.style.height = '180px';
    spacer.style.flexShrink = '0';
    listEl.appendChild(spacer);
    listEl.scrollTop = 0;

    component.onMediaLoad();
    expect(listEl.scrollTop).toBeGreaterThan(0);
  });
});
