import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ModalsService } from '../../shared/services/modals.service';

@Component({
  selector: 'app-header',
  imports: [
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private modalsService: ModalsService ){}
  openCalendarModal() {
    this.modalsService.openCalendar();
  };

}
