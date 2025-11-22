import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatIconButton, MatIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  topic: string = '';
  groupImgUrl: string = '';
  constructor(private groupService: GroupService){}

  ngOnInit(): void {
    this.groupService.getTopic().subscribe(topic => {
      this.topic = topic
    });
    this.groupService.getGroupImgUrl().subscribe(groupImgUrl => {
      this.groupImgUrl = groupImgUrl
    });
  };
  
}
