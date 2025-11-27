import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalsService } from '../../../shared/services/modals.service';
import { Group } from '../../../shared/types/group';

@Component({
  selector: 'app-header',
  imports: [MatIconButton, MatIcon, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  group: Group = { topic: '' };
  imageFile: File | null = null;

  hoverTopic: boolean = false;
  editingTopic: boolean = false;
  newTopic: string = '';

  isTopicLoading = false;
  isTopicSuccess = false;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private modalsService: ModalsService
  ) {}

  ngOnInit(): void {
    this.groupService.getGroupSummary().subscribe((group) => {
      this.group = group;
    });
  }

  editGroupImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const pastImgUrl = this.group.groupImgUrl;
      this.group.groupImgUrl = URL.createObjectURL(this.imageFile);
      const formData = new FormData();
      formData.append('image', this.imageFile);
      const groupId = this.route.snapshot.paramMap.get('id');

      this.groupService.editGroupImg(formData, groupId!).subscribe({
        next: (newImageUrl) => {
          this.groupService.updateGroupSummary({ groupImgUrl: newImageUrl });
          this.group.groupImgUrl = newImageUrl;
        },
        error: () => {
          alert('Error al editar la imagen del grupo');
          this.group.groupImgUrl = pastImgUrl;
        },
      });
    }
  }
  openGroupInfo() {
    this.modalsService.openGroupInfo();
  }

  enableTopicEdit() {
    this.editingTopic = true;
    this.newTopic = this.group.topic;
  }

  submitTopicEdit() {
    if (this.newTopic && this.newTopic !== this.group.topic) {
      this.isTopicLoading = true;
      this.editingTopic = false;
      const pastTopic = this.group.topic;
      this.group.topic = this.newTopic;
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
          this.group.topic = pastTopic;
        },
      });
    }
  }
}
