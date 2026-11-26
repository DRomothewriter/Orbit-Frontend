import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-community-info-modal',
  standalone: false,
  templateUrl: './community-info-modal.component.html',
  styleUrl: './community-info-modal.component.scss'
})
export class CommunityInfoModalComponent {

}
