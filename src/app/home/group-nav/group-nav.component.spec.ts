import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { GroupNavComponent } from './group-nav.component';
import { GroupService } from '../../shared/services/group.service';
import { SocketService } from '../../shared/services/socket.service';
import { MessageService } from '../../shared/services/message.service';
import { UserService } from '../../shared/services/user.service';
import { ModalsService } from '../../shared/services/modals.service';
import { Group } from '../../shared/types/group';
import { Message } from '../../shared/types/message';
import { MessageType } from '../../shared/types/message-type';
import { Notification } from '../../shared/types/notification';
import { NotificationType } from '../../shared/types/notification-type';

@Component({ standalone: true, template: '' })
class DummyRouteComponent {}

describe('GroupNavComponent', () => {
  let component: GroupNavComponent;
  let fixture: ComponentFixture<GroupNavComponent>;
  let myGroupsSubject: BehaviorSubject<Group[]>;
  let socketMessageSubject: Subject<Message>;
  let socketNotificationSubject: Subject<Notification>;
  let sentMessageSubject: Subject<Message>;
  let groupServiceSpy: any;
  let modalsServiceSpy: { openAvatarPreview: jasmine.Spy };

  beforeEach(async () => {
    myGroupsSubject = new BehaviorSubject<Group[]>([]);
    socketMessageSubject = new Subject<Message>();
    socketNotificationSubject = new Subject<Notification>();
    sentMessageSubject = new Subject<Message>();
    modalsServiceSpy = {
      openAvatarPreview: jasmine.createSpy('openAvatarPreview'),
    };

    groupServiceSpy = {
      myGroups$: myGroupsSubject.asObservable(),
      getMyGroups: jasmine.createSpy('getMyGroups').and.returnValue(of([])),
      getMyCommunityGroups: jasmine
        .createSpy('getMyCommunityGroups')
        .and.returnValue(of([])),
      updateGroupSummary: jasmine.createSpy('updateGroupSummary'),
      markGroupAsRead: jasmine
        .createSpy('markGroupAsRead')
        .and.returnValue(of({})),
      addGroupFromNotification: jasmine
        .createSpy('addGroupFromNotification')
        .and.callFake((group: Group, activeCommunityId: string) => {
          const groupCommunityId = group.communityId || '';
          if (groupCommunityId !== (activeCommunityId || '')) return;
          const current = myGroupsSubject.value;
          if (!current.some((g) => g._id === group._id)) {
            myGroupsSubject.next([group, ...current]);
          }
        }),
      applyIncomingMessage: jasmine
        .createSpy('applyIncomingMessage')
        .and.callFake(
          (msg: Message, activeGroupId: string, currentUserId: string) => {
            const current = myGroupsSubject.value;
            const updated = current.map((g) => {
              if (g._id !== msg.groupId) return g;
              const shouldIncrement =
                msg.groupId !== activeGroupId && msg.userId !== currentUserId;
              return {
                ...g,
                lastMessage: msg,
                unreadCount: shouldIncrement ? (g.unreadCount || 0) + 1 : 0,
              };
            });
            myGroupsSubject.next(updated);
          }
        ),
      clearUnreadCount: jasmine
        .createSpy('clearUnreadCount')
        .and.callFake((groupId: string) => {
          myGroupsSubject.next(
            myGroupsSubject.value.map((g) =>
              g._id === groupId ? { ...g, unreadCount: 0 } : g
            )
          );
        }),
    };

    await TestBed.configureTestingModule({
      imports: [GroupNavComponent],
      providers: [
        provideRouter([
          { path: 'home', component: DummyRouteComponent },
          { path: 'home/community/:communityId', component: DummyRouteComponent },
        ]),
        { provide: GroupService, useValue: groupServiceSpy },
        {
          provide: SocketService,
          useValue: {
            onMessage: () => socketMessageSubject.asObservable(),
            onNotification: () => socketNotificationSubject.asObservable(),
          },
        },
        {
          provide: MessageService,
          useValue: {
            sentMessage$: sentMessageSubject.asObservable(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getMyUser: () => of({ _id: 'u-me', username: 'diego' }),
          },
        },
        {
          provide: ModalsService,
          useValue: modalsServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render group avatar, name, last message preview, time and unread badge', () => {
    const todayIso = new Date().toISOString();
    myGroupsSubject.next([
      {
        _id: 'g1',
        topic: 'Equipo Orbit',
        groupImgUrl: 'https://cdn.orbit/team.png',
        unreadCount: 3,
        lastMessage: {
          _id: 'm1',
          groupId: 'g1',
          userId: 'u-other',
          username: 'ana',
          type: MessageType.TEXT,
          text: 'Nos vemos a las 4',
          createdAt: todayIso,
        },
      },
      {
        _id: 'g2',
        topic: 'General',
        unreadCount: 0,
        lastMessage: {
          _id: 'm2',
          groupId: 'g2',
          userId: 'u-other',
          username: 'luis',
          type: MessageType.IMAGE,
          text: '',
          createdAt: todayIso,
        },
      },
    ]);

    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.group-item'
    );
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Equipo Orbit');
    expect(items[0].textContent).toContain('Nos vemos a las 4');
    const badge0 = items[0].querySelector('.unread-badge');
    expect(badge0?.textContent?.trim()).toBe('3');

    expect(items[1].textContent).toContain('Imagen');
    expect(items[1].querySelector('.unread-badge')).toBeNull();
  });

  it('should highlight the active group card with .active class when selectedGroupId matches', () => {
    myGroupsSubject.next([
      { _id: 'g1', topic: 'Equipo Orbit' },
      { _id: 'g2', topic: 'General' },
    ]);
    component.selectedGroupId = 'g2';
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.group-item'
    );
    expect(items[0].classList.contains('active')).toBeFalse();
    expect(items[1].classList.contains('active')).toBeTrue();
    expect(items[1].getAttribute('aria-current')).toBe('page');
  });

  it('should increment unreadCount on incoming socket message for unselected group and clear on selectGroup', () => {
    myGroupsSubject.next([
      { _id: 'g1', topic: 'Equipo Orbit', unreadCount: 0 },
      { _id: 'g2', topic: 'General', unreadCount: 0 },
    ]);
    component.selectedGroupId = 'g1';
    fixture.detectChanges();

    socketMessageSubject.next({
      _id: 'm99',
      groupId: 'g2',
      userId: 'u-other',
      username: 'ana',
      type: MessageType.TEXT,
      text: 'Nuevo mensaje',
      createdAt: new Date().toISOString(),
    });
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.group-item'
    );
    expect(items[1].querySelector('.unread-badge')?.textContent?.trim()).toBe('1');
    expect(items[1].textContent).toContain('Nuevo mensaje');

    component.selectGroup(component.groups[1]);
    fixture.detectChanges();

    expect(groupServiceSpy.clearUnreadCount).toHaveBeenCalledWith('g2');
    expect(groupServiceSpy.markGroupAsRead).toHaveBeenCalledWith('g2');
  });

  it('should render group name larger and bold and open global avatar modal on avatar click without selecting group', () => {
    myGroupsSubject.next([
      {
        _id: 'g1',
        topic: 'Equipo Orbit',
        groupImgUrl: 'https://cdn.orbit/team.png',
      },
    ]);
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    const nameEl = hostEl.querySelector('.group-name') as HTMLElement;
    const computed = getComputedStyle(nameEl);
    expect(parseInt(computed.fontWeight, 10)).toBeGreaterThanOrEqual(700);
    expect(parseFloat(computed.fontSize)).toBeGreaterThanOrEqual(15);

    const avatarEl = hostEl.querySelector('.group-avatar') as HTMLElement;
    avatarEl.click();
    fixture.detectChanges();

    expect(groupServiceSpy.updateGroupSummary).not.toHaveBeenCalled();
    expect(modalsServiceSpy.openAvatarPreview).toHaveBeenCalledWith(
      'https://cdn.orbit/team.png',
      'Equipo Orbit'
    );
  });

  it('should render the filter bar at the top of sidebar-left, hidden above initial scrollTop and revealed on scroll to top', () => {
    const hostEl = fixture.nativeElement as HTMLElement;
    hostEl.style.height = '260px';
    hostEl.style.display = 'flex';
    hostEl.style.flexDirection = 'column';

    myGroupsSubject.next([
      { _id: 'g1', topic: 'Equipo Orbit', isDirect: false, unreadCount: 0 },
      { _id: 'g2', topic: 'ana', isDirect: true, unreadCount: 2 },
    ]);
    fixture.detectChanges();
    component.ngAfterViewInit();

    const sidebar = hostEl.querySelector('.sidebar-left') as HTMLElement;
    const filterBar = hostEl.querySelector('.groups-filter-bar') as HTMLElement;
    const groupsList = hostEl.querySelector('.groups-list') as HTMLElement;

    expect(filterBar).toBeTruthy();
    expect(sidebar.firstElementChild).toBe(filterBar);
    expect(filterBar.nextElementSibling).toBe(groupsList);

    const searchInput = filterBar.querySelector(
      'input.filter-search-input'
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    const buttons = Array.from(
      filterBar.querySelectorAll('button.filter-chip')
    ).map((b) => b.textContent?.trim());
    expect(buttons).toEqual(['Todos', 'Grupos', 'No leídos']);

    // Inicialmente oculto arriba mediante scrollTop > 0
    expect(sidebar.scrollTop).toBeGreaterThan(0);

    // Al hacer scroll hacia arriba (scrollTop = 0), la barra queda visible en el área superior
    sidebar.scrollTop = 0;
    sidebar.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(sidebar.scrollTop).toBe(0);
  });

  it('should filter conversations accumulatively by groups, unread, and search query', () => {
    myGroupsSubject.next([
      { _id: 'g1', topic: 'Equipo Orbit', isDirect: false, unreadCount: 0 },
      { _id: 'g2', topic: 'ana', isDirect: true, unreadCount: 2 },
      { _id: 'g3', topic: 'Proyecto X', isDirect: false, unreadCount: 1 },
      { _id: 'g4', topic: 'luis', isDirect: true, unreadCount: 0 },
    ]);
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    const getVisibleTopics = () =>
      Array.from(hostEl.querySelectorAll('.group-item .group-name')).map((el) =>
        el.textContent?.trim()
      );

    expect(getVisibleTopics()).toEqual([
      'Equipo Orbit',
      'ana',
      'Proyecto X',
      'luis',
    ]);

    const filterBtns = hostEl.querySelectorAll<HTMLButtonElement>(
      '.groups-filter-bar button.filter-chip'
    );
    const searchInput = hostEl.querySelector(
      '.groups-filter-bar input.filter-search-input'
    ) as HTMLInputElement;

    // Activar Grupos
    filterBtns[1].click();
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual(['Equipo Orbit', 'Proyecto X']);

    // Acumular No leídos (Grupos + No leídos) -> solo grupos con mensajes sin leer
    filterBtns[2].click();
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual(['Proyecto X']);

    // Desactivar Grupos -> queda solo No leídos
    filterBtns[1].click();
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual(['ana', 'Proyecto X']);

    // Todos limpia los filtros acumulados + búsqueda por nombre de contacto o grupo
    filterBtns[0].click();
    searchInput.value = 'orB';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual(['Equipo Orbit']);

    searchInput.value = 'ANA';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual(['ana']);

    // Sin resultados muestra estado vacío contextual
    searchInput.value = 'zzzz';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getVisibleTopics()).toEqual([]);
    expect(hostEl.querySelector('.groups-empty')?.textContent).toContain('zzzz');
  });

  it('should show orbit loader and hide previous community chats while loading a new community', async () => {
    const router = TestBed.inject(Router);
    const c1$ = new Subject<Group[]>();
    const c2$ = new Subject<Group[]>();

    groupServiceSpy.getMyCommunityGroups.and.callFake((communityId: string) => {
      return communityId === 'c1' ? c1$.asObservable() : c2$.asObservable();
    });

    await router.navigateByUrl('/home/community/c1');
    c1$.next([{ _id: 'g-c1', topic: 'Chat Comunidad 1' }]);
    c1$.complete();
    myGroupsSubject.next([{ _id: 'g-c1', topic: 'Chat Comunidad 1' }]);
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.querySelectorAll('.group-item').length).toBe(1);
    expect(hostEl.querySelector('app-orbit-loader')).toBeNull();

    // Al cambiar a la comunidad c2 (petición pendiente), debe mostrarse el loader inmediatamente
    await router.navigateByUrl('/home/community/c2');
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    expect(hostEl.querySelector('app-orbit-loader')).not.toBeNull();
    expect(hostEl.querySelectorAll('.group-item').length).toBe(0);

    // Al responder c2, se oculta el loader y se muestran los nuevos chats
    const c2Groups: Group[] = [{ _id: 'g-c2', topic: 'Chat Comunidad 2' }];
    myGroupsSubject.next(c2Groups);
    c2$.next(c2Groups);
    c2$.complete();
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(hostEl.querySelector('app-orbit-loader')).toBeNull();
    expect(hostEl.querySelectorAll('.group-item').length).toBe(1);
    expect(hostEl.querySelector('.group-item')?.textContent).toContain(
      'Chat Comunidad 2'
    );
  });

  it('should cancel previous community request when switching communities rapidly', async () => {
    const router = TestBed.inject(Router);
    let c1Unsubscribed = false;
    const c1$ = new Subject<Group[]>();
    const c2$ = new Subject<Group[]>();

    groupServiceSpy.getMyCommunityGroups.and.callFake((communityId: string) => {
      if (communityId === 'c1') {
        return new Observable<Group[]>((subscriber) => {
          const sub = c1$.subscribe(subscriber);
          return () => {
            c1Unsubscribed = true;
            sub.unsubscribe();
          };
        });
      }
      return c2$.asObservable();
    });

    await router.navigateByUrl('/home/community/c1');
    fixture.detectChanges();
    expect(component.isLoading).toBeTrue();

    // Cambiamos rápido a c2 antes de que c1 responda
    await router.navigateByUrl('/home/community/c2');
    fixture.detectChanges();

    expect(c1Unsubscribed).toBeTrue();
    expect(component.isLoading).toBeTrue();

    // Completar c2 apaga isLoading
    c2$.next([]);
    c2$.complete();
    fixture.detectChanges();
    expect(component.isLoading).toBeFalse();
  });

  it('should prepend group immediately on ADDED_TO_GROUP notification', () => {
    myGroupsSubject.next([{ _id: 'g-old', topic: 'Viejo' }]);
    fixture.detectChanges();

    socketNotificationSubject.next({
      _id: 'notif-1',
      type: NotificationType.ADDED_TO_GROUP,
      seen: false,
      data: { _id: 'g-new', topic: 'Nuevo Grupo', isDirect: false },
    } as Notification);
    fixture.detectChanges();

    expect(groupServiceSpy.addGroupFromNotification).toHaveBeenCalledWith(
      jasmine.objectContaining({ _id: 'g-new', topic: 'Nuevo Grupo' }),
      ''
    );
    expect(component.groups.map((g) => g._id)).toEqual(['g-new', 'g-old']);
  });
});
