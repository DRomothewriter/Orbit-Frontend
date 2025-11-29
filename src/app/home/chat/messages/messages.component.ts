import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Message } from '../../../shared/types/message';
import { MessageService } from '../../../shared/services/message.service';
import { SocketService } from '../../../shared/services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages',
  imports: [CommonModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];
  groupId: string = '';
  currentUser: string = '';

  @ViewChild('lastRef') lastRef!: ElementRef<HTMLLIElement>;

  constructor(
    private messageService: MessageService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}



  scrollToBottom() {
    setTimeout(() => {
      if(this.lastRef){
        this.lastRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  }

  ngOnInit(): void {
    this.userService.getMyUser().subscribe((user) => {
      this.currentUser = user.username;
    });

    this.route.paramMap.subscribe({
      next: (params) => {
        const groupId = params.get('id')!;
        console.log("here:", groupId)
        this.groupId = groupId;
        this.messageService.getGroupMessages(groupId).subscribe({
          next: (response: Message[]) => {
            this.messages = response;
            this.scrollToBottom()
          },
        });
      },
    });

    this.socketService.onMessage().subscribe({
      next: (response) => {
        //Verificar si es del grupo seleccionado. Si no, subir la card del grupo y sumar 1 al contador de mensajes sin leer.
        console.log(this.groupId)
        console.log(response.groupId)
        if (response.groupId === this.groupId) {
          this.messages.push(response);
          this.scrollToBottom();
        }
      },
    });
  }
}
