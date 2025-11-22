import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatIconButton, MatIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private selectedGroupId: string = '';
  private groupTopic: string = '';
  constructor(private groupService: GroupService){}

  ngOnInit(): void {
    const groupSummary = this.groupService.getGroupSummary();
    this.groupTopic = groupSummary.groupTopic;
    this.selectedGroupId = groupSummary.selectedGroupId;
  };
  
}
