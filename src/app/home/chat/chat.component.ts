import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { InfoComponent } from './info/info.component';
import { InputComponent } from './input/input.component';
import { MessagesComponent } from './messages/messages.component';

@Component({
  selector: 'app-chat',
  imports: [HeaderComponent, InfoComponent, InputComponent, MessagesComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

}
