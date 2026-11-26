import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-message',
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {

}
