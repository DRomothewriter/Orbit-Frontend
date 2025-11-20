import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MessageService } from '../../../shared/services/message.service';
import { Message } from '../../../shared/types/message';
import { UserService } from '../../../shared/services/user.service';
import { MessageType } from '../../../shared/types/message-type';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/types/user';
import { ActivatedRoute } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-input',
  imports: [FormsModule, CommonModule, MatIcon],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements OnInit {
  message: string = '';
  user: User;
  groupId: string = '';

  imageFile: File | null = null;
  imagePreview: string | null = null;

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
    handleImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];

      this.imagePreview = URL.createObjectURL(this.imageFile)
    }
  }
    removeImage() {
    this.imageFile = null;
    this.imagePreview = null;
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
          type: this.imageFile ? MessageType.IMAGE: MessageType.TEXT,
        };

        this.messageService.sendMessage(newMessage).subscribe({
          next: () => {
            this.message = ''; // limpia el input después de enviar
            this.removeImage();
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
