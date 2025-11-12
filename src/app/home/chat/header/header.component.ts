import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';

@Component({
  selector: 'app-header',
  imports: [],
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
