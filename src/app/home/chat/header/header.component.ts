import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatIconButton, MatIcon, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  topic: string = '';
  groupImgUrl: string = '';
  imageFile: File | null = null;

  hoverTopic: boolean = false;
  editingTopic: boolean = false;
  newTopic: string = '';

  isTopicLoading = false;
  isTopicSuccess = false;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.groupService.getTopic().subscribe((topic) => {
      this.topic = topic;
    });
    this.groupService.getGroupImgUrl().subscribe((groupImgUrl) => {
      this.groupImgUrl = groupImgUrl;
    });
  }

  editGroupImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const pastImgUrl = this.groupImgUrl;
      this.groupImgUrl = URL.createObjectURL(this.imageFile);
      const formData = new FormData();
      formData.append('image', this.imageFile);
      const groupId = this.route.snapshot.paramMap.get('id');

      this.groupService.editGroupImg(formData, groupId!).subscribe({
        next: (newImageUrl) => {
          this.groupService.setGroupImgUrl(newImageUrl);
          this.groupImgUrl = newImageUrl;
        },
        error: () => {
          alert('Error al editar la imagen del grupo');
          this.groupImgUrl = pastImgUrl;
        },
      });
    }
  }

  enableTopicEdit() {
    this.editingTopic = true;
    this.newTopic = this.topic;
  }

  submitTopicEdit() {
    if (this.newTopic && this.newTopic !== this.topic) {
      this.isTopicLoading = true;
      this.editingTopic = false;
      const pastTopic = this.topic;
      this.topic = this.newTopic;
      const groupId = this.route.snapshot.paramMap.get('id');
      this.groupService.editTopic(this.newTopic, groupId!).subscribe({
        next: () => {
          this.isTopicLoading = false;
          this.isTopicSuccess = true;
          setTimeout(() => {
            this.isTopicSuccess = false;
          }, 1500);
        },
        error: () => {
          alert('No se pudo editar el topic');
          this.isTopicLoading = false;
          this.topic = pastTopic;
        },
      });
    }
  }
}
