import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalsService } from '../../../shared/services/modals.service';
import { Group } from '../../../shared/types/group';
import { GroupMember } from '../../../shared/types/group-member';
import { Subscription, switchMap, EMPTY } from 'rxjs';
import { OrbitLoaderComponent } from '../../../shared/components/orbit-loader/orbit-loader.component';
import { OrbitAvatarPipe } from '../../../shared/pipes/orbit-avatar.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-header',
  imports: [MatIconButton, MatIcon, MatTooltipModule, FormsModule, OrbitLoaderComponent, OrbitAvatarPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  group: Group = { topic: '' };
  imageFile: File | null = null;

  hoverTopic: boolean = false;
  editingTopic: boolean = false;
  newTopic: string = '';

  isTopicLoading = false;
  isTopicSuccess = false;

  myGroupMember: GroupMember = {} as GroupMember;
  private subscriptions = new Subscription();

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private modalsService: ModalsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          switchMap((params) => {
            const groupId = params.get('id');
            if (!groupId) return EMPTY;
            return this.groupService.getGroupSummary(groupId);
          })
        )
        .subscribe((group) => {
          this.group = group;
          if (group._id) {
            this.groupService.getMyGroupMember(group._id).subscribe({
              next: (response: GroupMember) => {
                this.myGroupMember = response;
              },
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  deleteChat() {
    if (
      confirm(
        '¿Estás seguro de que quieres borrar este chat? Esta acción no se puede deshacer.'
      )
    ) {
      this.groupService.deleteGroup(this.group._id!).subscribe({
        next: () => {
          // Redirigir a home o friends
          this.router.navigate(['/home/']);
        },
        error: (err) => console.error('Error deleting chat', err),
      });
    }
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
        error: (e) => {
          alert('Error al editar la imagen del grupo');
          this.group.groupImgUrl = pastImgUrl;
          console.log('Error al editar la imagen del grupo', e);
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
        error: (e) => {
          alert('No se pudo editar el topic');
          this.isTopicLoading = false;
          this.group.topic = pastTopic;
          console.log('Error al editar la imagen del grupo', e);
        },
      });
    } else {
      this.editingTopic = false;
    }
  }

  startGroupCall(){
    this.modalsService.openCall();
  }
}
