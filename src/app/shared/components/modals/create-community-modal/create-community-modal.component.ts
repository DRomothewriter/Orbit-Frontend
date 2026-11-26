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
import { Subscription, finalize } from 'rxjs';

import { UserService } from '../../../services/user.service';
import { ModalsService } from '../../../services/modals.service';
import { GetFriendsResponse } from '../../../types/get-friends-response';
import { CommunityService } from '../../../services/community.service';
import { Community } from '../../../types/community';
import { OrbitAvatarPipe } from '../../../pipes/orbit-avatar.pipe';
import { OrbitLoaderComponent } from '../../orbit-loader/orbit-loader.component';

interface FriendshipSelectable extends GetFriendsResponse {
  selected?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-create-community-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OrbitLoaderComponent, OrbitAvatarPipe],
  templateUrl: './create-community-modal.component.html',
  styleUrl: './create-community-modal.component.scss',
})
export class CreateCommunityModalComponent implements OnInit, OnDestroy {
  currentStep: 1 | 2 = 1;

  // Paso 1: Selección de miembros
  searchQuery: string = '';
  selectedFriends: Set<string> = new Set();
  friends: FriendshipSelectable[] = [];

  // Paso 2: Identidad de la comunidad
  communityName: string = '';
  description: string = '';
  nameTouched = false;

  isLoadingContacts = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private communityService: CommunityService,
    private userService: UserService,
    private modalsService: ModalsService
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
        (f.friendId.username || '').toLowerCase().includes(q) ||
        (f.friendId.email || '').toLowerCase().includes(q)
    );
  }

  get selectedList(): FriendshipSelectable[] {
    return this.friends.filter(
      (f) => f.friendId._id && this.selectedFriends.has(f.friendId._id)
    );
  }

  get previewInitials(): string {
    const clean = this.communityName.trim();
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
      this.userService
        .getMyFriends()
        .pipe(finalize(() => (this.isLoadingContacts = false)))
        .subscribe({
          next: (friendships: GetFriendsResponse[]) => {
            this.friends = friendships.map((f) => ({ ...f, selected: false }));
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeModal(): void {
    this.modalsService.closeCreateCommunity();
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

  toggleFriend(friendship: FriendshipSelectable): void {
    const id = friendship.friendId._id;
    if (!id) return;
    if (this.selectedFriends.has(id)) {
      this.selectedFriends.delete(id);
      friendship.selected = false;
    } else {
      this.selectedFriends.add(id);
      friendship.selected = true;
    }
  }

  onFriendSelected(friendId: string): void {
    const match = this.friends.find((f) => f.friendId._id === friendId);
    if (match) {
      this.toggleFriend(match);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  createCommunity(): void {
    this.nameTouched = true;
    const cleanName = this.communityName.trim();
    if (!cleanName || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const community: Community = {
      communityName: cleanName,
    };
    const cleanDesc = this.description.trim();
    if (cleanDesc) {
      community.description = cleanDesc;
    }

    const friendIds: string[] = [...this.selectedFriends];
    this.communityService
      .createCommunity(community, friendIds)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating community:', err);
          this.errorMessage = 'No se pudo crear la comunidad. Intenta de nuevo.';
        },
      });
  }
}
