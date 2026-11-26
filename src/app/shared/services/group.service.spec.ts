import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { GroupService } from './group.service';
import { environment } from '../../../environments/environment';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('GRP-01: leaveGroup should call /groups/:groupId/leave-group with slash', () => {
    service.leaveGroup('g123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}groups/g123/leave-group`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('GRP-03: getGroupSummary(groupId) should fetch new group when current summary is a different group', () => {
    service.updateGroupSummary({ _id: 'g1', topic: 'Old' });
    service.getGroupSummary('g2').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}groups/g2`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: 'g2', topic: 'New' });
  });

  it('GRP-04: createGroup should not duplicate existing group in myGroups$', () => {
    let latestGroups: any[] = [];
    service.myGroups$.subscribe((g) => (latestGroups = g));

    service.createGroup({ topic: 'DM' }, ['u2']).subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}groups/`);
    req1.flush({ _id: 'g1', topic: 'DM' });

    service.createGroup({ topic: 'DM' }, ['u2']).subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}groups/`);
    req2.flush({ _id: 'g1', topic: 'DM' });

    expect(latestGroups.length).toBe(1);
  });

  it('GRP-05: createGroup should prepend newly created group to the top of myGroups$', () => {
    let latestGroups: any[] = [];
    service.myGroups$.subscribe((g) => (latestGroups = g));

    service.createGroup({ topic: 'Primero' }, []).subscribe();
    httpMock.expectOne(`${environment.apiUrl}groups/`).flush({ _id: 'g1', topic: 'Primero' });

    service.createGroup({ topic: 'Segundo' }, []).subscribe();
    httpMock.expectOne(`${environment.apiUrl}groups/`).flush({ _id: 'g2', topic: 'Segundo' });

    expect(latestGroups.map((g) => g._id)).toEqual(['g2', 'g1']);
  });

  it('GRP-06: addGroupFromNotification should prepend group when context matches and avoid duplicates', () => {
    let latestGroups: any[] = [];
    service.myGroups$.subscribe((g) => (latestGroups = g));

    service.createGroup({ topic: 'Existente' }, []).subscribe();
    httpMock.expectOne(`${environment.apiUrl}groups/`).flush({ _id: 'g1', topic: 'Existente' });

    // Grupo sin comunidad en vista principal -> debe quedar arriba
    (service as any).addGroupFromNotification({ _id: 'g2', topic: 'Nuevo' }, '');
    expect(latestGroups.map((g) => g._id)).toEqual(['g2', 'g1']);

    // Duplicado -> no duplica
    (service as any).addGroupFromNotification({ _id: 'g2', topic: 'Nuevo' }, '');
    expect(latestGroups.map((g) => g._id)).toEqual(['g2', 'g1']);

    // Grupo de comunidad cuando estamos en vista principal -> se ignora
    (service as any).addGroupFromNotification({ _id: 'g3', topic: 'Comunidad', communityId: 'c1' }, '');
    expect(latestGroups.map((g) => g._id)).toEqual(['g2', 'g1']);

    // Grupo de comunidad cuando estamos en esa comunidad -> se agrega arriba
    (service as any).addGroupFromNotification({ _id: 'g3', topic: 'Comunidad', communityId: 'c1' }, 'c1');
    expect(latestGroups.map((g) => g._id)).toEqual(['g3', 'g2', 'g1']);
  });
});
