import { Routes } from '@angular/router';

export const routes: Routes = [
    // Ruta para el login
    { 
        path: 'login', 
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) 
    },
    
    // Redirección por defecto al login
    { 
        path: '', 
        redirectTo: 'login', 
        pathMatch: 'full' 
    },
    
    // Aquí añadiremos más rutas (register, forgot-password, chat, etc.)
    // { path: 'register', ... },
    // { path: 'forgot-password', ... }
];
