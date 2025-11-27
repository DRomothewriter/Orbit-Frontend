import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { Group } from '../../shared/types/group';
import { GroupService } from '../../shared/services/group.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-group-nav',
  imports: [HeaderComponent],
  templateUrl: './group-nav.component.html',
  styleUrl: './group-nav.component.scss'
})
export class GroupNavComponent implements OnInit {
  groups: Group[] = [];

  constructor(private groupService: GroupService, private router: Router){}
  ngOnInit(): void {
      this.groupService.getMyGroups().subscribe({
        next:(groups) => {
          this.groups = groups;
          this.groupService.myGroups$.subscribe(groups => {
            this.groups = groups; 
          })
        }
      });
  };

  selectGroup(group: Group){
    if(!group.groupImgUrl) group.groupImgUrl = ''
    this.groupService.updateGroupSummary(group);
    this.router.navigateByUrl(`/home/${group._id}`);
  };
}
