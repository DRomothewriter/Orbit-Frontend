import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component:LoginComponent },
    { path: 'register', component: RegisterComponent }, 

    { 
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    children: [
      { path: 'direct', loadComponent: () => import('./chat/direct/direct.component').then(m => m.DirectComponent) },
      { path: 'group', loadComponent: () => import('./chat/group/group.component').then(m => m.GroupComponent) },
      { path: 'calendar', loadComponent: () => import('./calendar/calendar.component').then(m => m.CalendarComponent) },
    ]
  },
];
