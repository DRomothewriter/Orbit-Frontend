import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/services/user.service';
import { Friendship } from '../../../shared/types/friendship';

@Component({
  selector: 'app-pending',
  imports: [],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss',
})
export class PendingComponent implements OnInit {
  friendRequests: Friendship[] = [];
  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getRequestsReceived().subscribe({
      next: (fr: Friendship[]) => {
        this.friendRequests = fr;
      },
    });
  }

  acceptFriendRequest(friendId: string) {
    this.userService.acceptFriendRequest(friendId).subscribe({
      next: () => {
        const index = this.friendRequests.findIndex(
          (fr) => fr.friendId === friendId
        );
        if (index !== -1) {
          this.friendRequests.splice(index, 1);
        }

        alert('Friend Request accepted');
      },
      error: (err) => {},
    });
  }
}
