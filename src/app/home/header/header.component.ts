import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
<<<<<<< HEAD
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { SocialAuthService } from '@abacritt/angularx-social-login';

import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { TokenService } from '../../shared/services/token.service';
import { ModalsService } from '../../shared/services/modals.service';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/types/user';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Notification as INotification } from '../../shared/types/notification';
import { NotificationType } from '../../shared/types/notification-type';
import { MessageType } from '../../shared/types/message-type';
@Component({
    selector: 'app-header',
    standalone: true,
    imports: [MatIconModule, MatButtonModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
    NotificationType = NotificationType;
    MessageType = MessageType;
    user: User;
    isSettingsOpen = false;
    isNotificationsOpen = false;

    notifications: INotification[] = [];
    constructor(
        private modalsService: ModalsService,
        private userService: UserService,
        private tokenService: TokenService,
        private router: Router,
        private googleAuthService: SocialAuthService,
        private notificationsService: NotificationsService
    ) {
        this.user = this.userService.getCleanUser();
    }

    ngOnInit(): void {
        this.userService.currentUser$.subscribe((user) => {
            this.user = user;
        });
        this.notificationsService.currentNotifications$.subscribe(
            (notifications: INotification[]) => {
                this.notifications = notifications;
            }
        );
        this.notificationsService
            .getMyUnseenNotifications()
            .subscribe(() => {});
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
        this.userService.clearUser();
        try {
            this.googleAuthService.signOut();
        } catch (e) {
            console.log('Google session already closed or not active');
        }

        this.router.navigateByUrl('/login');
        this.closeSettings();
    }

    handleSettingClick(option: string) {
        console.log('Navegar a:', option);
        this.closeSettings();
        alert(`La sección ${option} estará disponible pronto.`);
    }

    openCalendarModal() {
        this.modalsService.openCalendar();
    }
    openMyuserModal() {
        this.modalsService.openMyUser();
    }

    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        if (this.isSettingsOpen) this.isNotificationsOpen = false;
    }
    closeSettings() {
        this.isSettingsOpen = false;
    }
}
=======
import { ModalsService } from '../../shared/services/modals.service';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/types/user';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { TokenService } from '../../shared/services/token.service'; 
import { Router } from '@angular/router'; 
import { SocialAuthService } from '@abacritt/angularx-social-login'; 

interface NotificationItem {
  type: 'friend_request' | 'message';
  data: any;
  timestamp: Date;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    ClickOutsideDirective
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  user: User;
  isSettingsOpen = false;
  isNotificationsOpen = false;
  
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  constructor(
    private modalsService: ModalsService, 
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router, 
    private googleAuthService: SocialAuthService 
  ){
    this.user = this.userService.getCleanUser();
  }

  ngOnInit(): void {
      this.userService.currentUser$.subscribe(user => {
        this.user = user;
      });
      this.userService.getMyUser().subscribe();
      this.loadNotifications();
  }
  
  loadNotifications() {
    this.userService.getRequestsReceived().subscribe({
      next: (requests) => {
        const friendNotifs: NotificationItem[] = requests.map(req => ({
          type: 'friend_request',
          data: req, 
          timestamp: new Date() 
        }));
        
    
        const mockMessages: NotificationItem[] = [
            {
                type: 'message',
                data: { 
                    username: 'Sistema Orbit', 
                    text: '¡Bienvenido a la nueva versión 2.0!', 
                    avatar: 'https://placehold.co/40x40/533483/ffffff?text=O' 
                },
                timestamp: new Date() 
            }
        ];

        this.notifications = [...friendNotifs, ...mockMessages];
        this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        this.updateUnreadCount();
      },
      error: (err) => console.error('Error cargando notificaciones', err)
    });
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.length;
  }

  markAsRead() {
    this.notifications = [];
    this.updateUnreadCount();
    this.isNotificationsOpen = false;
  }

  acceptRequest(friendshipId: string, event: Event) {
    event.stopPropagation();
    this.userService.acceptFriendRequest(friendshipId).subscribe({
        next: () => {
            this.removeNotification(friendshipId);
        }
    });
  }

  rejectRequest(friendshipId: string, event: Event) {
    event.stopPropagation();
    this.userService.deleteFriendship(friendshipId).subscribe({
        next: () => {
            this.removeNotification(friendshipId);
        }
    });
  }

  private removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.data._id !== id);
    this.updateUnreadCount();
  }

  
  handleLogout(): void {
    this.tokenService.logout();
    this.userService.clearUser();
    try {
        this.googleAuthService.signOut();
    } catch(e) { console.log('Google session already closed or not active'); }
    
    this.router.navigateByUrl('/login');
    this.closeSettings();
  }

  handleSettingClick(option: string) {
    console.log('Navegar a:', option);
    this.closeSettings();
    alert(`La sección ${option} estará disponible pronto.`);
  }

  openCalendarModal() { this.modalsService.openCalendar(); };
  openMyuserModal(){ this.modalsService.openMyUser(); };

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    if(this.isSettingsOpen) this.isNotificationsOpen = false;
  }
  closeSettings() { this.isSettingsOpen = false; }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if(this.isNotificationsOpen) this.isSettingsOpen = false;
    
    if(this.isNotificationsOpen) this.loadNotifications();
  }
  closeNotifications() { this.isNotificationsOpen = false; }
}
>>>>>>> main
