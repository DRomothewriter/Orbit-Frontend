import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GroupComponent } from '../chat/group/group.component';
import { DirectComponent } from '../chat/direct/direct.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    GroupComponent,
    DirectComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {}
  
  showDirectModal = false;
  showGroupModal = false;
  
  groups = [
    { name: 'Equipo Desarrollo', avatar: 'https://placehold.co/40x40/533483/ffffff?text=ED' },
    { name: 'Marketing', avatar: 'https://placehold.co/40x40/533483/ffffff?text=M' },
    { name: 'Diseño UX/UI', avatar: 'https://placehold.co/40x40/533483/ffffff?text=DX' },
    { name: 'Soporte Técnico', avatar: 'https://placehold.co/40x40/533483/ffffff?text=ST' }
  ];//Puuuuro ejemplo para ver como va quedando la interfaz

  directMessages = [
    { name: 'Ana García', lastMessage: '¿Revisaste el documento?', avatar: 'https://placehold.co/40x40/533483/ffffff?text=AG', online: true },
    { name: 'Carlos López', lastMessage: 'Reunión a las 3pm', avatar: 'https://placehold.co/40x40/533483/ffffff?text=CL', online: true },
    { name: 'María Rodríguez', lastMessage: 'Envié los archivos', avatar: 'https://placehold.co/40x40/533483/ffffff?text=MR', online: false },
    { name: 'David Martínez', lastMessage: 'Perfecto, gracias', avatar: 'https://placehold.co/40x40/533483/ffffff?text=DM', online: true }
  ];//Puuuuro ejemplo para ver como va quedando la interfaz

  onlineUsers = [
    { name: 'Ana García', avatar: 'https://placehold.co/32x32/533483/ffffff?text=AG' },
    { name: 'Carlos López', avatar: 'https://placehold.co/32x32/533483/ffffff?text=CL' },
    { name: 'David Martínez', avatar: 'https://placehold.co/32x32/533483/ffffff?text=DM' },
    { name: 'Laura Sánchez', avatar: 'https://placehold.co/32x32/533483/ffffff?text=LS' }
  ];//Puuuuro ejemplo para ver como va quedando la interfaz

  openDirectModal(): void {
    this.router.navigate(['/home/direct']);
  }

  closeDirectModal(): void {
    this.showDirectModal = false;
  }

  openGroupModal(): void {
    this.router.navigate(['/home/group']); 
  }

  closeGroupModal(): void {
    this.showGroupModal = false; 
  }

  openCalendar(): void {
    this.router.navigate(['/home/calendar']);
  }

  ngOnInit(): void {
    // Al entrar en Home, desactivamos el scroll del body para que la UI quede fija
    try {
      document.body.style.overflow = 'hidden';
    } catch (e) {
      // en entornos sin DOM (tests) evitamos lanzar
    }
  }

  ngOnDestroy(): void {
    // Restauramos el comportamiento por defecto al salir
    try {
      document.body.style.overflow = '';
    } catch (e) {
      // noop
    }
  }

}
