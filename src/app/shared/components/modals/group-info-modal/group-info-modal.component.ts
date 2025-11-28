import { Component, OnInit } from '@angular/core';
import { GetGroupMembersResponse } from '../../../types/get-group-members-response';
import { ModalsService } from '../../../services/modals.service';
import { GroupService } from '../../../services/group.service';
import { ActivatedRoute } from '@angular/router';
import { Group } from '../../../types/group';
import { AddMembersModalComponent } from '../add-members-modal/add-members-modal.component';

@Component({
  selector: 'app-group-info-modal',
  imports: [AddMembersModalComponent],
  templateUrl: './group-info-modal.component.html',
  styleUrl: './group-info-modal.component.scss',
})
export class GroupInfoModalComponent implements OnInit {
  groupMembers: GetGroupMembersResponse[] = [];
  group: Group = { topic: '' };

  isAddMembersOpen: boolean = false;

  constructor(
    private modalsServices: ModalsService,
    private groupService: GroupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('id');
    this.groupService.getGroupMembers(groupId!).subscribe({
      next: (response) => {
        this.groupMembers = response;
      },
    });

    this.groupService.getGroupSummary().subscribe((group) => {
      this.group = group;
    });
    this.modalsServices.openAddMembers$.subscribe((val) => {
      this.isAddMembersOpen = val;
    });
    
  }

  closeModal(): void {
    this.modalsServices.closeGroupInfo();
  }

  openAddMembers(): void {
    this.modalsServices.openAddMembers();
  }
}
