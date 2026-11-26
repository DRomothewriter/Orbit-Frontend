import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { of } from 'rxjs';

import { MyuserModalComponent } from './myuser-modal.component';

describe('MyuserModalComponent', () => {
  let component: MyuserModalComponent;
  let fixture: ComponentFixture<MyuserModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyuserModalComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: SocialAuthService,
          useValue: {
            authState: of(null),
            initState: of(false),
            signOut: jasmine.createSpy('signOut'),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyuserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
