import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../friends-panel/header/header.component'; // use relative path

@Component({
  selector: 'app-friends-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent // 👈 importante para que reconozca <app-header>
  ],
  templateUrl: './friends-panel.component.html',
  styleUrls: ['./friends-panel.component.scss'] // 👈 plural
})
export class FriendsPanelComponent {}
