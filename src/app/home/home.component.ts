import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GroupNavComponent } from './group-nav/group-nav.component';
import { SocketService } from '../shared/services/socket.service';

@Component({
  selector: 'app-home',
  imports: [ GroupNavComponent, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{

  constructor(private sockeService: SocketService){}
  ngOnInit(): void {
    this.sockeService.connectWithGroups();
  }
}
