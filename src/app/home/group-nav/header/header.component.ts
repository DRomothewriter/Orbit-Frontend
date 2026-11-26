import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ModalsService } from '../../../shared/services/modals.service';
import { MatIcon } from '@angular/material/icon';


@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-header',
  imports: [MatIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})



export class HeaderComponent {

  constructor(private modalsService: ModalsService){}

  openCreateGroup(): void{
    this.modalsService.openCreateGroup();
  };
}
