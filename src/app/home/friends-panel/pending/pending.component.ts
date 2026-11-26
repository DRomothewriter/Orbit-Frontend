import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { finalize } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { GetReceivedRequestsResponse } from '../../../shared/types/get-received-requests-response';
import { OrbitLoaderComponent } from '../../../shared/components/orbit-loader/orbit-loader.component';
import { OrbitAvatarPipe } from '../../../shared/pipes/orbit-avatar.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-pending',
  imports: [OrbitLoaderComponent, OrbitAvatarPipe],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss',
})
export class PendingComponent implements OnInit {
  friendRequests: GetReceivedRequestsResponse[] = [];
  isLoading = false;
  constructor(private userService: UserService) {}

  ngOnInit() {
    this.isLoading = true;
    this.userService
      .getRequestsReceived()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (fr: GetReceivedRequestsResponse[]) => {
          this.friendRequests = fr;
        },
      });
  }

  acceptFriendRequest(friendId: string) {
    this.userService.acceptFriendRequest(friendId).subscribe({
      next: () => {
        const index = this.friendRequests.findIndex(
          (fr) => fr._id === friendId
        );
        if (index !== -1) {
          this.friendRequests.splice(index, 1);
        }

        alert('Friend Request accepted');
      },
      error: (err) => {
        console.error('Error accepting friend request:', err);
        alert('No se pudo aceptar la solicitud de amistad.');
      },
    });
  }
}
