import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CreateCommunityModalComponent } from './create-community-modal.component';
import { CommunityService } from '../../../services/community.service';
import { UserService } from '../../../services/user.service';
import { ModalsService } from '../../../services/modals.service';
import { GetFriendsResponse } from '../../../types/get-friends-response';

describe('CreateCommunityModalComponent', () => {
  let component: CreateCommunityModalComponent;
  let fixture: ComponentFixture<CreateCommunityModalComponent>;
  let communityServiceSpy: jasmine.SpyObj<CommunityService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let modalsServiceSpy: jasmine.SpyObj<ModalsService>;

  const mockFriends: GetFriendsResponse[] = [
    {
      _id: 'rel-1',
      friendId: { _id: 'u-1', username: 'alice', email: 'alice@orbit.dev', status: 'online' },
    } as GetFriendsResponse,
    {
      _id: 'rel-2',
      friendId: { _id: 'u-2', username: 'bob', email: 'bob@orbit.dev', status: 'offline' },
    } as GetFriendsResponse,
  ];

  beforeEach(async () => {
    communityServiceSpy = jasmine.createSpyObj('CommunityService', ['createCommunity']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getMyFriends']);
    modalsServiceSpy = jasmine.createSpyObj('ModalsService', ['closeCreateCommunity']);

    userServiceSpy.getMyFriends.and.returnValue(of(mockFriends));
    communityServiceSpy.createCommunity.and.returnValue(
      of({ _id: 'c-1', communityName: 'Observatorio' })
    );

    await TestBed.configureTestingModule({
      imports: [CreateCommunityModalComponent],
      providers: [
        { provide: CommunityService, useValue: communityServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ModalsService, useValue: modalsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCommunityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create on step 1 with loaded friends', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep).toBe(1);
    expect(component.friends.length).toBe(2);
  });

  it('should transition between step 1 and step 2 and render progress badge', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Paso 1 de 2');

    component.goToStep2();
    fixture.detectChanges();

    expect(component.currentStep).toBe(2);
    expect(el.textContent).toContain('Paso 2 de 2');

    component.goToStep1();
    fixture.detectChanges();

    expect(component.currentStep).toBe(1);
  });

  it('should send communityName, description, and selected friendIds on createCommunity', () => {
    component.toggleFriend(component.friends[0]);
    component.goToStep2();
    component.communityName = '  Observatorio Orbit  ';
    component.description = '  Espacio de astronomía  ';
    fixture.detectChanges();

    component.createCommunity();

    expect(communityServiceSpy.createCommunity).toHaveBeenCalledWith(
      {
        communityName: 'Observatorio Orbit',
        description: 'Espacio de astronomía',
      },
      ['u-1']
    );
    expect(modalsServiceSpy.closeCreateCommunity).toHaveBeenCalled();
  });

  it('should not submit when communityName is empty and should set nameTouched', () => {
    component.goToStep2();
    component.communityName = '   ';
    component.createCommunity();

    expect(component.nameTouched).toBeTrue();
    expect(communityServiceSpy.createCommunity).not.toHaveBeenCalled();
  });

  it('should show errorMessage when createCommunity fails', () => {
    communityServiceSpy.createCommunity.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    component.goToStep2();
    component.communityName = 'Orbit';
    component.createCommunity();

    expect(component.errorMessage).toContain('No se pudo crear la comunidad');
    expect(modalsServiceSpy.closeCreateCommunity).not.toHaveBeenCalled();
  });
});
