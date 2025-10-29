import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMyProfileModalComponent } from './edit-my-profile-modal.component';

describe('EditMyProfileModalComponent', () => {
  let component: EditMyProfileModalComponent;
  let fixture: ComponentFixture<EditMyProfileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMyProfileModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMyProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
