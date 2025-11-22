import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

import { GroupService } from '../../../services/group.service';
import { UserService } from '../../../services/user.service';
import { Group } from '../../../types/group';
import { ModalsService } from '../../../services/modals.service';
import { GetFriendsResponse } from '../../../types/get-friends-response';

interface FriendshipSelectable extends GetFriendsResponse {
  selected?: boolean;
}

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.scss',
})
export class CreateGroupModalComponent implements OnInit {
  topic: string = '';
  selectedFriends: Set<string> = new Set();
  friends: FriendshipSelectable[] = [];

  friendAvatarImg = 'https://placehold.co/40x40/533483/ffffff?text=A';

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private modalsService: ModalsService
  ) {}

  ngOnInit(): void {
      this.userService.getMyFriends().subscribe({
        next:(friendships: GetFriendsResponse[])=> {
          this.friends = friendships.map((f) => ({ ...f, selected: false }));
        }
      })
  }
  closeModal(): void {
    //service para cerrar el modal
    this.modalsService.closeCreateGroup();
  }

  onFriendSelected(friendId: string): void {
    if (this.selectedFriends.has(friendId)) {
      this.selectedFriends.delete(friendId);
    } else {
      this.selectedFriends.add(friendId);
    }
  }

  createGroup(): void {
    const group: Group = {
      topic: this.topic,
    };
    const friendIds: string[] = [...this.selectedFriends];
    this.groupService.createGroup(group, friendIds).subscribe({
      next: (response: Group) => {
        this.closeModal();
      },
      error: (err) => {
        console.log('Error creating group');
      },
    });
  }
}
