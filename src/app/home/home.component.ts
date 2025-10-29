import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommunitiesNavComponent } from './communities-nav/communities-nav.component';
import { ChatComponent } from './chat/chat.component';
import { GroupNavComponent } from './group-nav/group-nav.component';

@Component({
  selector: 'app-home',
  imports: [CommunitiesNavComponent, ChatComponent, GroupNavComponent, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
