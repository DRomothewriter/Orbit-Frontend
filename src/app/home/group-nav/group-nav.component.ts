import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { Group } from '../../shared/types/group';
import { GroupService } from '../../shared/services/group.service';
import { SocketService } from '../../shared/services/socket.service';
import { MessageService } from '../../shared/services/message.service';
import { UserService } from '../../shared/services/user.service';
import { ModalsService } from '../../shared/services/modals.service';
import { MessageType } from '../../shared/types/message-type';
import { NotificationType } from '../../shared/types/notification-type';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, finalize, Observable, Subscription, take } from 'rxjs';
import { OrbitLoaderComponent } from '../../shared/components/orbit-loader/orbit-loader.component';
import { OrbitAvatarPipe, resolveOrbitAvatar } from '../../shared/pipes/orbit-avatar.pipe';
import { OrbitChatTimePipe } from '../../shared/pipes/orbit-chat-time.pipe';

export type GroupNavFilter = 'groups' | 'unread';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-group-nav',
  imports: [HeaderComponent, OrbitLoaderComponent, OrbitAvatarPipe, OrbitChatTimePipe],
  templateUrl: './group-nav.component.html',
  styleUrl: './group-nav.component.scss',
})
export class GroupNavComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidebarScroll') sidebarScrollRef?: ElementRef<HTMLElement>;

  groups: Group[] = [];
  filterGroups: boolean = false;
  filterUnread: boolean = false;
  searchQuery: string = '';
  communityId: string = '';
  selectedGroupId: string = '';
  currentUserId: string = '';
  isLoading: boolean = false;
  private initialized = false;
  private readonly filterBarHeight = 78;
  private subscriptions = new Subscription();
  private groupsRequestSub?: Subscription;

  constructor(
    private groupService: GroupService,
    private socketService: SocketService,
    private messageService: MessageService,
    private userService: UserService,
    private modalsService: ModalsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService
        .getMyUser()
        .pipe(take(1))
        .subscribe({
          next: (user) => {
            this.currentUserId = user?._id || '';
          },
        })
    );

    this.subscriptions.add(
      this.groupService.myGroups$.subscribe((groups) => {
        this.groups = groups;
      })
    );

    this.subscriptions.add(
      this.socketService.onMessage().subscribe({
        next: (message) => {
          this.groupService.applyIncomingMessage(
            message,
            this.selectedGroupId,
            this.currentUserId
          );
        },
      })
    );

    if (typeof this.socketService.onNotification === 'function') {
      this.subscriptions.add(
        this.socketService.onNotification().subscribe({
          next: (notification) => {
            if (
              notification?.type === NotificationType.ADDED_TO_GROUP &&
              notification.data?._id
            ) {
              this.groupService.addGroupFromNotification(
                notification.data,
                this.communityId
              );
            }
          },
        })
      );
    }

    if (this.messageService.sentMessage$) {
      this.subscriptions.add(
        this.messageService.sentMessage$.subscribe({
          next: (message) => {
            this.groupService.applyIncomingMessage(
              message,
              this.selectedGroupId,
              this.currentUserId
            );
          },
        })
      );
    }

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          this.updateGroupsBasedOnRoute();
        })
    );

    this.updateGroupsBasedOnRoute();
  }

  ngAfterViewInit(): void {
    this.hideFilterBarAboveScroll();
  }

  ngOnDestroy(): void {
    this.groupsRequestSub?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  private hideFilterBarAboveScroll(): void {
    const el = this.sidebarScrollRef?.nativeElement;
    if (!el) return;
    el.scrollTop = this.filterBarHeight;
  }

  get isAllFilterActive(): boolean {
    return !this.filterGroups && !this.filterUnread;
  }

  clearFilters(): void {
    this.filterGroups = false;
    this.filterUnread = false;
  }

  toggleFilter(filter: GroupNavFilter): void {
    if (filter === 'groups') {
      this.filterGroups = !this.filterGroups;
    } else if (filter === 'unread') {
      this.filterUnread = !this.filterUnread;
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchQuery = input?.value ?? '';
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  get filteredGroups(): Group[] {
    let list = this.groups;
    if (this.filterGroups) {
      list = list.filter((g) => !g.isDirect);
    }
    if (this.filterUnread) {
      list = list.filter((g) => (g.unreadCount ?? 0) > 0);
    }

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((g) =>
        (g.topic || '').toLowerCase().includes(query)
      );
    }
    return list;
  }

  get emptyStateMessage(): string {
    const query = this.searchQuery.trim();
    if (query) {
      return `Sin resultados para "${query}"`;
    }
    if (this.filterGroups && this.filterUnread) {
      return 'No tienes grupos con mensajes sin leer';
    }
    if (this.filterGroups) {
      return 'No tienes grupos aún';
    }
    if (this.filterUnread) {
      return 'Sin mensajes sin leer';
    }
    return 'Sin conversaciones activas';
  }

  private updateGroupsBasedOnRoute(): void {
    let route = this.route.root;
    let communityId: string | null = null;
    let groupId: string | null = null;

    while (route.firstChild) {
      route = route.firstChild;
      if (route.snapshot.paramMap.has('communityId')) {
        communityId = route.snapshot.paramMap.get('communityId');
      }
      if (route.snapshot.paramMap.has('id')) {
        groupId = route.snapshot.paramMap.get('id');
      }
    }

    this.selectedGroupId = groupId || '';
    if (this.selectedGroupId) {
      this.groupService.clearUnreadCount(this.selectedGroupId);
    }

    if (communityId && communityId !== this.communityId) {
      this.communityId = communityId;
      this.initialized = true;
      this.loadGroups(this.groupService.getMyCommunityGroups(communityId));
    } else if (!communityId && (this.communityId || !this.initialized)) {
      this.communityId = '';
      this.initialized = true;
      this.loadGroups(this.groupService.getMyGroups());
    }
  }

  private loadGroups(request$: Observable<Group[]>): void {
    this.groupsRequestSub?.unsubscribe();
    this.groups = [];
    this.isLoading = true;
    this.groupsRequestSub = request$
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();
  }

  getLastMessagePreview(group: Group): string {
    const last = group.lastMessage;
    if (!last) return 'Sin mensajes aún';
    const text = last.text?.trim();
    if (text) return text;

    switch (last.type) {
      case MessageType.IMAGE:
        return '📷 Imagen';
      case MessageType.VOICE:
        return '🎤 Mensaje de voz';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.EVENT:
        return '📅 Evento';
      case MessageType.MEDIA:
        return '📎 Multimedia';
      default:
        return 'Nuevo mensaje';
    }
  }

  formatUnreadCount(count?: number): string {
    if (!count || count <= 0) return '';
    return count > 99 ? '99+' : String(count);
  }

  openAvatarPreview(group: Group, event: Event): void {
    event.stopPropagation();
    const url = resolveOrbitAvatar(
      group.groupImgUrl,
      group._id || group.topic
    );
    this.modalsService.openAvatarPreview(url, group.topic || 'Grupo');
  }

  selectGroup(group: Group) {
    if (!group.groupImgUrl) group.groupImgUrl = '';
    this.selectedGroupId = group._id || '';
    this.groupService.updateGroupSummary(group);

    if (group._id) {
      this.groupService.clearUnreadCount(group._id);
      this.groupService.markGroupAsRead(group._id).subscribe({ error: () => {} });
    }

    if (this.communityId) {
      this.router.navigateByUrl(
        `/home/community/${this.communityId}/group/${group._id}`
      );
    } else {
      this.router.navigateByUrl(`/home/${group._id}`);
    }
  }
}
