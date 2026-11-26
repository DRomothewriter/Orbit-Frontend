import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CommunitiesNavComponent } from './communities-nav.component';
import { CommunityService } from '../../shared/services/community.service';
import { ModalsService } from '../../shared/services/modals.service';

describe('CommunitiesNavComponent', () => {
  let component: CommunitiesNavComponent;
  let fixture: ComponentFixture<CommunitiesNavComponent>;
  let modalsService: ModalsService;

  beforeEach(async () => {
    const communityServiceSpy = jasmine.createSpyObj(
      'CommunityService',
      ['getMyCommunities', 'updateCommunitySummary', 'cleanCommunitySummary'],
      { myCommunities$: of([]) }
    );
    communityServiceSpy.getMyCommunities.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CommunitiesNavComponent],
      providers: [
        provideRouter([]),
        { provide: CommunityService, useValue: communityServiceSpy },
      ],
    }).compileComponents();

    modalsService = TestBed.inject(ModalsService);
    fixture = TestBed.createComponent(CommunitiesNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open create community modal via ModalsService without rendering it inside communities-nav', () => {
    spyOn(modalsService, 'openCreateCommunity').and.callThrough();

    component.openCreateCommunity();
    fixture.detectChanges();

    expect(modalsService.openCreateCommunity).toHaveBeenCalled();
    const modalInsideNav = fixture.nativeElement.querySelector('app-create-community-modal');
    expect(modalInsideNav).toBeNull();
  });
});
