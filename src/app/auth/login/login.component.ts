import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Aunque no usemos el toggle, es bueno tenerlo para los iconos sociales

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Ya no necesitamos la lógica de hidePassword
}

