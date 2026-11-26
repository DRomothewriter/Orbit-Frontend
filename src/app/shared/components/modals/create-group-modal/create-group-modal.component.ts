import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription, finalize, of, switchMap, catchError, map } from 'rxjs';

import { GroupService } from '../../../services/group.service';
import { UserService } from '../../../services/user.service';
import { Group } from '../../../types/group';
import { ModalsService } from '../../../services/modals.service';
import { GetFriendsResponse } from '../../../types/get-friends-response';
import { CommunityService } from '../../../services/community.service';
import { User } from '../../../types/user';
import { GetCommunityMembersResponse } from '../../../types/get-community-members-response';
import { OrbitAvatarPipe } from '../../../pipes/orbit-avatar.pipe';
import { OrbitLoaderComponent } from '../../orbit-loader/orbit-loader.component';

interface FriendshipSelectable extends User {
  selected?: boolean;
}

export interface GroupPermissions {
  onlyAdminsEditInfo: boolean;
  membersCanInvite: boolean;
  allCanSendMessages: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OrbitLoaderComponent, OrbitAvatarPipe],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.scss',
})
export class CreateGroupModalComponent implements OnInit, OnDestroy {
  currentStep: 1 | 2 = 1;

  // Paso 1: Selección de miembros
  searchQuery: string = '';
  selectedFriends: Set<string> = new Set();
  friends: FriendshipSelectable[] = [];
  communityId: string | undefined;

  // Paso 2: Identidad y permisos
  topic: string = '';
  description: string = '';
  topicTouched = false;
  imageFile: File | null = null;
  imagePreview: string | null = null;

  permissions: GroupPermissions = {
    onlyAdminsEditInfo: true,
    membersCanInvite: false,
    allCanSendMessages: true,
  };

  isLoadingContacts = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private modalsService: ModalsService,
    private communityService: CommunityService,
    private router: Router
  ) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isSubmitting) {
      this.closeModal();
    }
  }

  get filteredFriends(): FriendshipSelectable[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.friends;
    return this.friends.filter(
      (f) =>
        (f.username || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q)
    );
  }

  get selectedList(): FriendshipSelectable[] {
    return this.friends.filter((f) => f._id && this.selectedFriends.has(f._id));
  }

  get previewInitials(): string {
    const clean = this.topic.trim();
    if (!clean) return '';
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.isLoadingContacts = true;
    this.subscriptions.add(
      this.communityService.getCommunitySummary().subscribe((community) => {
        if (community._id) {
          this.communityId = community._id;
          this.subscriptions.add(
            this.communityService
              .getCommunityMembers(community._id)
              .pipe(finalize(() => (this.isLoadingContacts = false)))
              .subscribe({
                next: (communityMembers: GetCommunityMembersResponse[]) => {
                  this.friends = communityMembers.map((cm) => ({
                    ...cm.userId,
                    selected: false,
                  }));
                },
              })
          );
        } else {
          this.subscriptions.add(
            this.userService
              .getMyFriends()
              .pipe(finalize(() => (this.isLoadingContacts = false)))
              .subscribe({
                next: (friendships: GetFriendsResponse[]) => {
                  this.friends = friendships.map((f) => ({
                    ...f.friendId,
                    selected: false,
                  }));
                },
              })
          );
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
    this.subscriptions.unsubscribe();
  }

  closeModal(): void {
    this.modalsService.closeCreateGroup();
  }

  goToStep2(): void {
    this.errorMessage = null;
    this.currentStep = 2;
  }

  goToStep1(): void {
    if (this.isSubmitting) return;
    this.errorMessage = null;
    this.currentStep = 1;
  }

  toggleFriend(friend: FriendshipSelectable): void {
    const id = friend._id;
    if (!id) return;
    if (this.selectedFriends.has(id)) {
      this.selectedFriends.delete(id);
      friend.selected = false;
    } else {
      this.selectedFriends.add(id);
      friend.selected = true;
    }
  }

  onFriendSelected(friendId: string): void {
    const match = this.friends.find((f) => f._id === friendId);
    if (match) {
      this.toggleFriend(match);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.revokePreviewUrl();
    this.imageFile = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  removeImage(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.revokePreviewUrl();
    this.imageFile = null;
    this.imagePreview = null;
  }

  togglePermission(key: keyof GroupPermissions): void {
    this.permissions[key] = !this.permissions[key];
  }

  private revokePreviewUrl(): void {
    if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
  }

  createGroup(): void {
    this.topicTouched = true;
    const cleanTopic = this.topic.trim();
    if (!cleanTopic || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const group: Group = {
      topic: cleanTopic,
    };
    if (this.description.trim()) {
      group.description = this.description.trim();
    }
    if (this.communityId) {
      group.communityId = this.communityId;
    }

    const friendIds: string[] = [...this.selectedFriends];
    this.groupService
      .createGroup(group, friendIds)
      .pipe(
        switchMap((createdGroup) => {
          if (this.imageFile && createdGroup._id) {
            const formData = new FormData();
            formData.append('image', this.imageFile);
            return this.groupService
              .editGroupImg(formData, createdGroup._id)
              .pipe(
                map((imageUrl) => ({
                  ...createdGroup,
                  groupImgUrl: imageUrl || createdGroup.groupImgUrl,
                })),
                catchError(() => of(createdGroup))
              );
          }
          return of(createdGroup);
        }),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (createdGroup) => {
          this.groupService.updateGroupSummary(createdGroup);
          this.closeModal();
          if (createdGroup?._id) {
            if (this.communityId) {
              this.router.navigateByUrl(
                `/home/community/${this.communityId}/group/${createdGroup._id}`
              );
            } else {
              this.router.navigateByUrl(`/home/${createdGroup._id}`);
            }
          }
        },
        error: (err) => {
          console.error('Error creating group:', err);
          if (err?.status === 409) {
            this.errorMessage =
              err.error?.error ||
              'Ya existe un chat individual con este usuario. No se pueden crear chats individuales duplicados.';
            return;
          }
          this.errorMessage = 'No se pudo crear el grupo. Intenta de nuevo.';
        },
      });
  }
}
