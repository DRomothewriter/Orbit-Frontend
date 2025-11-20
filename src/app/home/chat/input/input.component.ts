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
      next: (params) => {
        this.groupId = params.get('id')!;
      },
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

      this.imagePreview = URL.createObjectURL(this.imageFile);
    }
  }
  removeImage() {
    this.imageFile = null;
    this.imagePreview = null;
  }

  handleSubmit() {
    if (!this.message.trim() && !this.imageFile) return;

    if (this.imageFile) {
      // Enviar imagen
      const formData = new FormData();
      formData.append('groupId', this.groupId);
      formData.append('username', this.user.username);
      formData.append('image', this.imageFile);
      formData.append('text', this.message || '');

      this.messageService.sendImageMessage(formData).subscribe({
        next: () => {
          this.message = '';
          this.removeImage();
        },
        error: (err) => console.error('Error sending image:', err),
      });
    } else {
      // Enviar mensaje de texto normal
      const messageData: Message = {
        username: this.user.username,
        groupId: this.groupId,
        userId: this.user._id!,
        type: MessageType.TEXT,
        text: this.message,
      };

      this.messageService.sendMessage( messageData ).subscribe({
        next: () => (this.message = ''),
        error: (err) => console.error('Error sending message:', err),
      });
    }
  }
  

  @ViewChild('messageInput') messageInput!: ElementRef;

  adjustHeight(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
