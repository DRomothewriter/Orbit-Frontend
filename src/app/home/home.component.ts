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

@Component({
  selector: 'app-home',
  imports: [
    CreateGroupModalComponent,
    CalendarModalComponent,
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
  constructor(private sockeService: SocketService, private modalsService: ModalsService, private router: Router) {}
  ngOnInit(): void {
    this.modalsService.openCreateGroup$.subscribe(val => this.isCreateGroupOpen = val);
    this.modalsService.openCalendar$.subscribe(val => this.isCalendarOpen = val);
    //así con todos los modals
    
    this.sockeService.connectWithGroups();
  }

  navToFriends(){
    this.router.navigateByUrl('/home/friends');
  }
}
