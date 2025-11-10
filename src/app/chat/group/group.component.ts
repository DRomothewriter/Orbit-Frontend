import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {
  constructor(private router: Router) {}

  @Output() modalClosed = new EventEmitter<void>();

  availableContacts = [
    { name: 'Ana García', avatar: 'https://placehold.co/40x40/533483/ffffff?text=A', online: true },
    { name: 'Carlos López', avatar: 'https://placehold.co/40x40/533483/ffffff?text=C', online: false },
    { name: 'María Rodríguez', avatar: 'https://placehold.co/40x40/533483/ffffff?text=M', online: true },
    { name: 'David Martínez', avatar: 'https://placehold.co/40x40/533483/ffffff?text=D', online: true },
    { name: 'Laura Sánchez', avatar: 'https://placehold.co/40x40/533483/ffffff?text=L', online: false }
  ];

  closeModal(): void {
    // Emitir el evento para el caso modal
    this.modalClosed.emit();
    // Si estamos en la ruta /home/group, navegar de vuelta a /home
    if (window.location.pathname.includes('/home/group')) {
      this.router.navigate(['/home']);
    }
  }

  createGroup(): void {
    console.log('Creando nuevo grupo...');
    // Aquí puedes agregar la lógica para crear el grupo
    this.closeModal();
  }
}
