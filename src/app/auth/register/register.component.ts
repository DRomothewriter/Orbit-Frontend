import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Importar el Servicio
import { AuthService } from '../../shared/services/auth.service';
import { TokenService } from '../../shared/services/token.service';
import { UserService } from '../../shared/services/user.service';
import { AuthResponse } from '../../shared/types/auth-response';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);
  private router = inject(Router);

  isLoading = false;
  errorMessage: string | null = null;

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const { name, email, password } = this.registerForm.value;

    this.authService.signup(name!, email!, password!).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        // Guarda el token y redirige
          this.router.navigateByUrl('/home');
          this.userService.setUser(res.user);
          this.tokenService.setToken(res.token);
          
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'No se pudo completar el registro.';
      }
    });
  }
}