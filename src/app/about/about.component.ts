import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../shared/services/theme.service';
import { TokenService } from '../shared/services/token.service';

interface OrbitFeature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly features: OrbitFeature[] = [
    {
      icon: 'groups',
      title: 'Comunidades y Grupos',
      description:
        'Organiza conversaciones en comunidades temáticas y canales privados con estructura clara y roles definidos.',
    },
    {
      icon: 'bolt',
      title: 'Mensajería en Tiempo Real',
      description:
        'Sincronización instantánea vía WebSockets con estado de presencia, notificaciones y lectura fluida.',
    },
    {
      icon: 'videocam',
      title: 'Videollamadas WebRTC',
      description:
        'Audio y video de baja latencia impulsados por Mediasoup SFU para colaborar cara a cara sin fricción.',
    },
    {
      icon: 'auto_awesome',
      title: 'Atmósferas Astronómicas',
      description:
        'Alterna entre Noche Profunda y Cielo Estrellado con una interfaz diseñada para cuidar la vista y el enfoque.',
    },
  ];

  readonly stack = [
    'Angular 19 Standalone',
    'Node.js & Express',
    'Socket.io',
    'Mediasoup WebRTC',
    'MongoDB',
  ];

  constructor(
    public themeService: ThemeService,
    private tokenService: TokenService
  ) {}

  get isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
