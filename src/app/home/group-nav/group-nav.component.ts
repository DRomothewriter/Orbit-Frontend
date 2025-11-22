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

  groupAvatarDummy = 'https://placehold.co/40x40/533483/ffffff?text=ED'


  constructor(private groupService: GroupService, private router: Router){}
  ngOnInit(): void {
      this.groupService.getMyGroups().subscribe({
        next:(groups) => {
          this.groups = groups;
        }
      });
  };

  selectGroup(groupId: string, groupImgUrl: string, topic: string){
    this.groupService.setGroupImgUrl(groupImgUrl);
    this.groupService.setTopic(topic);
    this.router.navigateByUrl(`/home/${groupId}`);
  };
}
