import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Aunque no usemos el toggle, es bueno tenerlo para los iconos sociales
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { AuthResponse } from '../../shared/types/auth-response';
import { UserService } from '../../shared/services/user.service';
import { TokenService } from '../../shared/services/token.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private userService: UserService, private tokenService: TokenService) {}

  onLogin() {
    console.log(this.email, this.password);
    console.log("here")
    this.authService.login(this.email, this.password)
      .subscribe({
        next: (res: AuthResponse) => {
          console.log('login exitoso', res);
          this.router.navigateByUrl('/home');
          this.userService.setUser(res.user);
          this.tokenService.setToken(res.token);
          
        },
        error: (err) => {
          console.error('Error en login', err);
        }
      });
  
  }
}

