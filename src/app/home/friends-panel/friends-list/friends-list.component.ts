import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../../shared/types/user';
import { UserService } from '../../../shared/services/user.service';
import { GetFriendsResponse } from '../../../shared/types/get-friends-response';

@Component({
  selector: 'app-friends-list',
  imports: [MatIcon, CommonModule],
  templateUrl: './friends-list.component.html',
  styleUrl: './friends-list.component.scss'
})
export class FriendsListComponent implements OnInit{
  friends: User[] = [];

  constructor(private userService: UserService){}
  ngOnInit(): void {
      this.userService.getMyFriends().subscribe({
        next:(friendships: GetFriendsResponse[])=> {
          this.friends = friendships.map(f => f.friendId);
        }
      })
  }
}
