import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { Group } from '../../../shared/types/group';
import { UserService } from '../../../shared/services/user.service';
import { Friendship } from '../../../shared/types/friendship';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface FriendshipSelectable extends Friendship {
  selected?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})



export class HeaderComponent implements OnInit{
  topic: string = '';
  groupModal: boolean = false;
  selectedFriends: Set<string> = new Set();
  myFriends: FriendshipSelectable[] = [];
  constructor(private groupService: GroupService, private userService: UserService){}
  ngOnInit(): void {
      this.userService.getMyFriends().subscribe({
        next: (friendships) => {
          this.myFriends = friendships.map(f => ({ ...f, selected: false }));
        } 
      });
  }
  setGroupModal(b: boolean): void{
    this.groupModal = b;
    return;
  };

  onFriendSelected(friendship: Friendship): void{
    if(this.selectedFriends.has(friendship.friendId)){
      this.selectedFriends.delete(friendship.friendId);
    } else {
      this.selectedFriends.add(friendship.friendId);
    };
  };

  handleCreateGroup(){
    const group: Group = {
      topic: this.topic
    }
    const friendIds: string[] = [...this.selectedFriends];
    this.groupService.createGroup(group, friendIds).subscribe({
      next: (response: Group) => {
        this.setGroupModal(false);
      },
      error: (err) => {
        console.log("Error creating group");
      }
    })
  }
}
