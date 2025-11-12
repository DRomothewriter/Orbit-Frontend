import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { AuthResponse } from '../../shared/types/auth-response';
import { TokenService } from '../../shared/services/token.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router, private userService: UserService, private tokenService: TokenService) {}

  onSubmit() {
    this.authService.signup(this.username, this.email, this.password)
      .subscribe({
        next: (res: AuthResponse) => {
          console.log('Signup exitoso', res);
          this.router.navigateByUrl('/home');
          this.userService.setUser(res.user);
          this.tokenService.setToken(res.token);
          
        },
        error: (err) => {
          console.error('Error en signup', err);
        }
      });
  }
}