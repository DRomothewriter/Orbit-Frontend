import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }


  login(email: string, password: string): Observable<boolean> {
    // Simulación: solo 'admin@orbit.com' y 'password' funcionan
    if (email === 'admin@orbit.com' && password === 'password') {
      return timer(1000).pipe(
        map(() => {
          console.log('AuthService: Login exitoso');
          // Aquí guardaríamos el token (ej. localStorage)
          return true;
        })
      );
    } else {
      // Simula un error del servidor
      return timer(1000).pipe(
        switchMap(() => throwError(() => new Error('Credenciales inválidas')))
      );
    }
  }


  register(name: string, email: string, password: string): Observable<boolean> {
  
    return timer(1500).pipe(
      map(() => {
        console.log(`AuthService: Usuario registrado ${name} (${email})`);
        // Aquí guardaríamos el token y loguearíamos al usuario
        return true;
      })
    );
  }

  /**
   * Simula un cierre de sesión.
   */
  logout(): void {
    // Aquí borraríamos el token (ej. localStorage)
    console.log('AuthService: Sesión cerrada');
  }
}
