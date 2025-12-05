import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { Group } from '../../shared/types/group';
import { GroupService } from '../../shared/services/group.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-group-nav',
  imports: [HeaderComponent],
  templateUrl: './group-nav.component.html',
  styleUrl: './group-nav.component.scss',
})
export class GroupNavComponent implements OnInit {
  groups: Group[] = [];
  communityId: string = '';
  constructor(
    private groupService: GroupService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.groupService.myGroups$.subscribe((groups) => {
      this.groups = groups;
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateGroupsBasedOnRoute();
      });

    this.updateGroupsBasedOnRoute();
  }

  private updateGroupsBasedOnRoute(): void {
    let route = this.route.root;
    let communityId: string | null = null;

    while (route.firstChild) {
      route = route.firstChild;
      if (route.snapshot.paramMap.has('communityId')) {
        communityId = route.snapshot.paramMap.get('communityId');
      }
    }

    console.log('communityId detectado:', communityId);

    if (communityId && communityId !== this.communityId) {
      this.communityId = communityId;
      this.groupService.getMyCommunityGroups(communityId).subscribe();
    } else if (!communityId && this.communityId) {
      this.communityId = '';
      this.groupService.getMyGroups().subscribe();
    } else if (!communityId && !this.communityId) {
      this.groupService.getMyGroups().subscribe();
    }
  }

  selectGroup(group: Group) {
    if (!group.groupImgUrl) group.groupImgUrl = '';
    this.groupService.updateGroupSummary(group);

    if (this.communityId) {
      this.router.navigateByUrl(
        `/home/community/${this.communityId}/group/${group._id}`
      );
    } else {
      this.router.navigateByUrl(`/home/${group._id}`);
    }
  }
}
