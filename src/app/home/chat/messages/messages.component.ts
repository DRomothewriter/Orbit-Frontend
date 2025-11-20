import { Component, OnInit } from '@angular/core';
import { Message } from '../../../shared/types/message';
import { MessageService } from '../../../shared/services/message.service';
import { SocketService } from '../../../shared/services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];
  groupId: string = '';
  currentUser: string = '';
  constructor(
    private messageService: MessageService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMyUser().subscribe(user => {
      this.currentUser = user.username;
    })

    this.route.paramMap.subscribe({
      next: (params) => {
        const groupId = params.get('id')!;
        this.groupId = groupId;
        this.messageService.getGroupMessages(groupId).subscribe({
          next: (response: any) => {
            this.messages = response.messages;
            console.log(response.messages)
          },
        });
      },
    });

    this.socketService.onMessage().subscribe({
      next: (response) => {
        //Verificar si es del grupo seleccionado. Si no, subir la card del grupo y sumar 1 al contador de mensajes sin leer.
        if (response.groupId === this.groupId) {
          this.messages.push(response);
        }
      },
    });
  }
}
