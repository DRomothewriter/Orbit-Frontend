import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-direct',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './direct.component.html',
  styleUrl: './direct.component.scss'
})
export class DirectComponent  {
  constructor(private router: Router) {}
  
  @Output() modalClosed = new EventEmitter<void>();

  availableContacts = [
    { name: 'Ana García', avatar: 'https://placehold.co/40x40/533483/ffffff?text=A', online: true },
    { name: 'Carlos López', avatar: 'https://placehold.co/40x40/533483/ffffff?text=C', online: false },
    { name: 'María Rodríguez', avatar: 'https://placehold.co/40x40/533483/ffffff?text=M', online: true }
  ];

  closeModal(): void {
    // Emitir el evento para el caso modal
    this.modalClosed.emit();
    // Navegar de vuelta a /home si estamos en la ruta
    if (window.location.pathname.includes('/home/direct')) {
      this.router.navigate(['/home']);
    }
  }

  selectContact(contact: any): void {
    console.log('Contacto seleccionado:', contact);
    this.closeModal();
  }
}
