import { Component, OnInit } from '@angular/core';
import { Message } from '../../../shared/types/message';
import { MessageService } from '../../../shared/services/message.service';
import { SocketService } from '../../../shared/services/socket.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];

  constructor(
    private messageService: MessageService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('id');

    if(groupId){
      this.messageService.getGroupMessages(groupId).subscribe({
        next: (response: any) => {
          this.messages = response.messages;
        },
      });
      this.socketService.onMessage().subscribe({
        next: (response) => {
          //Verificar si es del grupo seleccionado. Si no, subir la card del grupo y sumar 1 al contador de mensajes sin leer.
          if (response.groupId === groupId) {
            this.messages.push(response);
          };
        },
      });
    }
  }
}
