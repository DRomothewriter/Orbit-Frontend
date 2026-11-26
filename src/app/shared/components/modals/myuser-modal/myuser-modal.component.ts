import {
  Component,
  OnInit,
  OnChanges,
  Input,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

import { ModalsService, ModalAnchor } from '../../../services/modals.service';
import { UserService } from '../../../services/user.service';
import { TokenService } from '../../../services/token.service';
import { SocketService } from '../../../services/socket.service';
import { GroupService } from '../../../services/group.service';
import { CommunityService } from '../../../services/community.service';
import { NotificationsService } from '../../../services/notifications.service';

import { User } from '../../../types/user';
import { UserStatus } from '../../../types/user-status';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { OrbitAvatarPipe } from '../../../pipes/orbit-avatar.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-myuser-modal',
  imports: [MatButtonModule, MatIcon, CommonModule, FormsModule, OrbitAvatarPipe],
  templateUrl: './myuser-modal.component.html',
  styleUrl: './myuser-modal.component.scss',
})
export class MyuserModalComponent implements OnInit, OnChanges {
  @Input() anchor: ModalAnchor | null = null;
  @Input() isClosing = false;

  modalTop = 64;
  modalLeft = 12;
  transformOrigin = 'top right';

  UserStatus = UserStatus;
  user: User;
  imageFile: File | null = null;

  editingUsername = false;
  hoverUsername = false;
  newUsername = '';

  isUsernameLoading = false;
  isUsernameSuccess = false;
  
  constructor(
    private modalService: ModalsService,
    private userService: UserService,
    private socketService: SocketService, // Inyectar
    private router: Router,
    private tokenService: TokenService,
    private googleAuthService: SocialAuthService,
    private groupService: GroupService,
    private communityService: CommunityService,
    private notificationsService: NotificationsService
  ) {
    this.user = this.userService.getCleanUser();
  }

  ngOnInit(): void {
    this.updatePosition();
    this.userService.getMyUser().subscribe((user) => {
      this.user = user;
    });
  }

  ngOnChanges(): void {
    this.updatePosition();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updatePosition();
  }

  private updatePosition(): void {
    const margin = 12;
    const modalWidth = Math.min(380, window.innerWidth * 0.92);
    const modalHeight = 400;

    if (this.anchor) {
      const rawLeft = this.anchor.x - modalWidth + 24;
      const rawTop = this.anchor.y + 12;

      this.modalLeft = Math.round(
        Math.max(margin, Math.min(rawLeft, window.innerWidth - modalWidth - margin))
      );
      this.modalTop = Math.round(
        Math.max(margin, Math.min(rawTop, window.innerHeight - modalHeight - margin))
      );

      const originX = Math.max(0, Math.min(modalWidth, this.anchor.x - this.modalLeft));
      this.transformOrigin = `${Math.round(originX)}px top`;
    } else {
      this.modalLeft = Math.round(
        Math.max(margin, window.innerWidth - modalWidth - margin)
      );
      this.modalTop = 64;
      this.transformOrigin = 'top right';
    }
  }

  closeModal(): void {
    this.modalService.closeMyUser();
  }

  setStatus(status: UserStatus) {
    // 1. Actualizar en Backend y Localmente (UserService maneja ambos)
    this.userService.changeUserStatus(status).subscribe(() => {
        // 2. Avisar a los amigos por Socket
        this.socketService.emitStatusChange(status);
    });
    
    // Optimista: Actualizar la vista inmediatamente
    this.user.status = status;
  }

  editProfileImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      this.user.profileImgUrl = URL.createObjectURL(this.imageFile);

      const formData = new FormData();
      formData.append('image', this.imageFile);
      this.userService.editProfileImg(formData).subscribe({
        next: (newProfileImgUrl) => {
          this.user.profileImgUrl = newProfileImgUrl;
        },
      });
    }
  }

  handleLogout(): void {
    this.tokenService.logout();
    sessionStorage.removeItem('userStatus');
    this.socketService.disconnect();
    this.userService.clearUser();
    this.groupService.clearGroups();
    this.communityService.clearCommunities();
    this.notificationsService.clearNotifications();
    this.modalService.closeAll();
    try {
        this.googleAuthService.signOut();
    } catch(e) {}
    
    this.router.navigateByUrl('/login');
  }

  enableUsernameEdit() {
    this.editingUsername = true;
    this.newUsername = this.user.username;
  }

  submitUsernameEdit() {
    if (this.newUsername && this.newUsername !== this.user.username) {
      this.isUsernameLoading = true;
      this.isUsernameSuccess = false;
      this.editingUsername = false;
      const pastUsername = this.user.username;
      this.user.username = this.newUsername;
      this.userService.editUsername(this.newUsername).subscribe({
        next: () => {
          this.isUsernameLoading = false;
          this.isUsernameSuccess = true;
          setTimeout(() => (this.isUsernameSuccess = false), 1500);
        },
        error: () => {
          alert('Error changing username');
          this.user.username = pastUsername;
          this.isUsernameLoading = false;
          this.isUsernameSuccess = false;
        },
      });
    } else {
      this.editingUsername = false;
    }
  }
}