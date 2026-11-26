import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommunityService } from '../../shared/services/community.service';
import { Community } from '../../shared/types/community';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ModalsService } from '../../shared/services/modals.service';
import { MatIcon } from '@angular/material/icon';
import { filter, Subscription } from 'rxjs';
import { OrbitAvatarPipe } from '../../shared/pipes/orbit-avatar.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-communities-nav',
  imports: [MatIcon, OrbitAvatarPipe],
  templateUrl: './communities-nav.component.html',
  styleUrl: './communities-nav.component.scss',
})
export class CommunitiesNavComponent implements OnInit, OnDestroy {
  communities: Community[] = [];
  selectedCommunityId: string = '';
  private subscriptions = new Subscription();

  constructor(
    private communityService: CommunityService,
    private router: Router,
    private route: ActivatedRoute,
    private modalsService: ModalsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.communityService.myCommunities$.subscribe((communities) => {
        this.communities = communities;
      })
    );
    this.subscriptions.add(this.communityService.getMyCommunities().subscribe());

    this.subscriptions.add(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe(() => this.syncSelectedCommunityFromRoute())
    );
    this.syncSelectedCommunityFromRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private syncSelectedCommunityFromRoute(): void {
    let current = this.route.root;
    let foundId = '';
    while (current.firstChild) {
      current = current.firstChild;
      if (current.snapshot.paramMap.has('communityId')) {
        foundId = current.snapshot.paramMap.get('communityId') || '';
      }
    }
    this.selectedCommunityId = foundId;
  }

  openCreateCommunity(): void {
    this.modalsService.openCreateCommunity();
  }
  selectCommunity(community: Community) {
    if (!community.communityImgUrl) community.communityImgUrl = '';
    this.selectedCommunityId = community._id || '';
    this.communityService.updateCommunitySummary(community);
    this.router.navigateByUrl(`/home/community/${community._id}`);
  }

  goToHome() {
    this.selectedCommunityId = '';
    this.communityService.cleanCommunitySummary();
    this.router.navigateByUrl(`/home`);
  }
}
