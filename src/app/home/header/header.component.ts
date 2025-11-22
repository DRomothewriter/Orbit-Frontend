import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ModalsService } from '../../shared/services/modals.service';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/types/user';

@Component({
  selector: 'app-header',
  imports: [
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{
  user: User;
  constructor(private modalsService: ModalsService, private userService: UserService ){
    this.user = this.userService.getCleanUser();
  }

  ngOnInit(): void {
      this.userService.getMyUser().subscribe(user => {
        this.user = user;
      })
  }
  openCalendarModal() {
    this.modalsService.openCalendar();
  };
  openMyuserModal(){
    this.modalsService.openMyUser();
  };
}
