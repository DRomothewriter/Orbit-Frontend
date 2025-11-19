import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
interface Friend {
  name: string;
  avatarUrl?: string;
  online: boolean;
}
@Component({
  selector: 'app-friends-list',
  imports: [MatIcon, CommonModule],
  templateUrl: './friends-list.component.html',
  styleUrl: './friends-list.component.scss'
})
export class FriendsListComponent {
  friends: Friend[] = [
    { name: 'Diego', avatarUrl: '', online: true },
    { name: 'Ana', avatarUrl: '', online: false },
    { name: 'Luis', avatarUrl: '', online: true }
  ];
}
