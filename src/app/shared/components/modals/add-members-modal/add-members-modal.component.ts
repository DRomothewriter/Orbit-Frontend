import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { GetFriendsResponse } from '../../../types/get-friends-response';
import { User } from '../../../types/user';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { ModalsService } from '../../../services/modals.service';

@Component({
  selector: 'app-add-members-modal',
  standalone: false,
  templateUrl: './add-members-modal.component.html',
  styleUrl: './add-members-modal.component.scss'
})
export class AddMembersModalComponent implements OnInit{
  users: User[] = [];
  selectedUsers: Set<string> = new Set();

  isLoading: boolean = false;
  isSuccess: boolean = false;
  constructor(private userService: UserService, private route: ActivatedRoute, private groupService: GroupService, private modalsServices: ModalsService){}

  ngOnInit(): void {
      this.userService.getMyFriends().subscribe({
        next: (response: GetFriendsResponse[]) => {
          this.users = response.map(friendship => friendship.friendId);
        }
      })
  }

  onUserSelected(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }
  addMembers(): void {
    this.isLoading = true;
    const groupId: string = this.route.snapshot.paramMap.get('id')!;
    const userIds: string[] = [...this.selectedUsers];
    this.groupService.addGroupMembers(userIds, groupId).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
        setTimeout(()=> {
          this.isSuccess = false;
        }, 1500)
        this.closeModal();
      }
    })
  }

  closeModal(){
    this.modalsServices.closeAddMembers();
  };

}
