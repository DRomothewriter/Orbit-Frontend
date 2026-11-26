import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { SocialAuthService } from '@abacritt/angularx-social-login';

import { TokenService } from '../../shared/services/token.service';
import { ModalsService } from '../../shared/services/modals.service';
import { UserService } from '../../shared/services/user.service';
import { SocketService } from '../../shared/services/socket.service';
import { GroupService } from '../../shared/services/group.service';
import { CommunityService } from '../../shared/services/community.service';
import { User } from '../../shared/types/user';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Notification as INotification } from '../../shared/types/notification';
import { NotificationType } from '../../shared/types/notification-type';
import { MessageType } from '../../shared/types/message-type';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { ThemeService } from '../../shared/services/theme.service';
import { OrbitAvatarPipe } from '../../shared/pipes/orbit-avatar.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-header',
    standalone: true,
    imports: [MatIconModule, MatButtonModule, CommonModule, RouterLink, ClickOutsideDirective, OrbitAvatarPipe],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
    NotificationType = NotificationType;
    MessageType = MessageType;
    user: User;
    isSettingsOpen = false;
    isNotificationsOpen = false;

    notifications: INotification[] = [];
    private subscriptions = new Subscription();

    constructor(
        private modalsService: ModalsService,
        private userService: UserService,
        private tokenService: TokenService,
        private router: Router,
        private googleAuthService: SocialAuthService,
        private notificationsService: NotificationsService,
        private socketService: SocketService,
        private groupService: GroupService,
        private communityService: CommunityService,
        public themeService: ThemeService
    ) {
        this.user = this.userService.getCleanUser();
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.userService.currentUser$.subscribe((user) => {
                this.user = user;
            })
        );
        this.subscriptions.add(
            this.notificationsService.currentNotifications$.subscribe(
                (notifications: INotification[]) => {
                    this.notifications = Array.isArray(notifications)
                        ? notifications
                        : [];
                }
            )
        );
        this.subscriptions.add(
            this.notificationsService
                .getMyUnseenNotifications()
                .subscribe(() => {})
        );
        this.subscriptions.add(
            this.socketService.onNotification().subscribe((notification) => {
                this.notificationsService.addNotification(notification);
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    markAsRead() {
        this.notificationsService.updateToSeen(this.notifications).subscribe();
    }

    toggleNotifications() {
        this.isNotificationsOpen = !this.isNotificationsOpen;
        if (this.isNotificationsOpen) this.isSettingsOpen = false;
    }
    closeNotifications() {
        this.isNotificationsOpen = false;
    }

    handleLogout(): void {
        this.tokenService.logout();
        sessionStorage.removeItem('userStatus');
        this.socketService.disconnect();
        this.userService.clearUser();
        this.groupService.clearGroups();
        this.communityService.clearCommunities();
        this.notificationsService.clearNotifications();
        this.modalsService.closeAll();
        try {
            this.googleAuthService.signOut();
        } catch (e) {
            console.log('Google session already closed or not active');
        }

        this.router.navigateByUrl('/login');
        this.closeSettings();
    }

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }

    handleSettingClick(option: string) {
        if (option === 'Apariencia') {
            this.themeService.toggleTheme();
            this.closeSettings();
            return;
        }
        console.log('Navegar a:', option);
        this.closeSettings();
        alert(`La sección ${option} estará disponible pronto.`);
    }

    openCalendarModal() {
        this.modalsService.openCalendar();
    }
    openMyuserModal(event?: MouseEvent) {
        let anchor: { x: number; y: number } | undefined;
        if (event) {
            if (event.clientX > 0 || event.clientY > 0) {
                anchor = { x: event.clientX, y: event.clientY };
            } else if (event.currentTarget instanceof HTMLElement) {
                const rect = event.currentTarget.getBoundingClientRect();
                anchor = { x: rect.right, y: rect.bottom };
            }
        }
        this.modalsService.openMyUser(anchor);
    }

    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        if (this.isSettingsOpen) this.isNotificationsOpen = false;
    }
    closeSettings() {
        this.isSettingsOpen = false;
    }
}
