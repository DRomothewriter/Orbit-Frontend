import { Component, ChangeDetectionStrategy } from '@angular/core';
import { finalize } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/types/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrbitLoaderComponent } from '../../../shared/components/orbit-loader/orbit-loader.component';
import { OrbitAvatarPipe } from '../../../shared/pipes/orbit-avatar.pipe';


@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.scss',
  imports: [CommonModule, FormsModule, OrbitLoaderComponent, OrbitAvatarPipe]
})
export class AddFriendComponent {
  searchQuery = '';
  users: User[] = [];
  isLoading = false;

  constructor(private userService: UserService) {}

  onSearch() {
    if (!this.searchQuery.trim()) return;
    this.isLoading = true;
    this.userService
      .searchUsers(this.searchQuery)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => {
          this.users = users;
        },
        error: (err) => console.error('Error al buscar usuarios', err),
      });
  }

  sendFriendRequest(userId: string) {
    this.userService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.searchQuery = '';
        this.users = [];
        alert('Solicitud enviada')},
      error: (err) => alert('Error al enviar solicitud')
    });
  }
}