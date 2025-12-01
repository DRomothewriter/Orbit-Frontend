import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { GroupNavComponent } from './group-nav/group-nav.component';
import { SocketService } from '../shared/services/socket.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './header/header.component';
import { ModalsService } from '../shared/services/modals.service';
import { CreateGroupModalComponent } from '../shared/components/modals/create-group-modal/create-group-modal.component';
import { CalendarModalComponent } from '../shared/components/modals/calendar-modal/calendar-modal.component';
import { UserService } from '../shared/services/user.service';
import { MyuserModalComponent } from '../shared/components/modals/myuser-modal/myuser-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CreateGroupModalComponent,
    CalendarModalComponent,
    MyuserModalComponent,
    GroupNavComponent,
    HeaderComponent,
    RouterOutlet,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  isCreateGroupOpen = false;
  isCalendarOpen = false;
  isMyUserOpen = false;
  
  constructor(
    private sockeService: SocketService,
    private modalsService: ModalsService,
    private router: Router,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    this.modalsService.openCreateGroup$.subscribe(
      (val) => (this.isCreateGroupOpen = val)
    );
    this.modalsService.openCalendar$.subscribe(
      (val) => (this.isCalendarOpen = val)
    );
    this.modalsService.openMyUser$.subscribe(
      (val) => (this.isMyUserOpen = val)
    );
    
    this.userService.getMyUser().subscribe(user=>{
      if(user && user._id){
        this.sockeService.connectWithGroups();
      }
    });
  }

  navToFriends() {
    this.router.navigateByUrl('/home/friends');
  }
}