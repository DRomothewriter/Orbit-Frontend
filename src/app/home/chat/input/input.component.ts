import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MessageService } from '../../../shared/services/message.service';
import { Message } from '../../../shared/types/message';
import { GroupService } from '../../../shared/services/group.service';
import { UserService } from '../../../shared/services/user.service';
import { MessageType } from '../../../shared/types/message-type';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/types/user';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements OnInit {
  message: string = '';
  user: User;
  groupId: string = '';
  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.user = this.userService.getCleanUser();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: (params)=> {
        this.groupId = params.get('id')!;
      }
    });
    this.userService.getMyUser().subscribe({
      next: (user) => {
        this.user = user;
      },
    });
  }

  handleSubmit() {
    if (!this.message.trim()) return;
    this.userService.getMyUser().subscribe({
      next: (user) => {
        const newMessage: Message = {
          //  campos necesarios según Message
          userId: user._id!,
          username: user.username,
          groupId: this.groupId,
          text: this.message,
          type: MessageType.TEXT, //Por ahora no cambia el type
        };

        this.messageService.sendMessage(newMessage).subscribe({
          next: () => {
            this.message = ''; // limpia el input después de enviar
          },
          error: (err) => {
            console.error('Error sending message:', err);
          },
        });
      },
    });
  }

  @ViewChild('messageInput') messageInput!: ElementRef;

  adjustHeight(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
