import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../shared/services/group.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip'; // Importante para la UI
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconButton, MatIcon, MatTooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  topic: string = '';
  groupImgUrl: string = '';
  currentGroupId: string | null = null;

  constructor(
    private groupService: GroupService,
    private router: Router,
    private route: ActivatedRoute // Necesario para saber qué borrar
  ){}

  ngOnInit(): void {
    // Suscripciones a los observables del servicio
    this.groupService.getTopic().subscribe(topic => this.topic = topic);
    this.groupService.getGroupImgUrl().subscribe(url => this.groupImgUrl = url);

    // Obtener ID del grupo actual desde la URL (o servicio si lo guardas ahí)
    // Nota: Como este componente es hijo de ChatComponent, a veces es mejor pasar el ID como Input, 
    // pero intentaremos obtenerlo de la ruta activa.
    this.route.paramMap.subscribe(params => {
        // Esto puede requerir acceder a la ruta padre dependiendo de tu estructura de rutas
        // Si header está dentro de ChatComponent que tiene la ruta :id
        this.currentGroupId = this.router.url.split('/').pop() || null; 
    });
  }

  deleteChat() {
    if (!this.currentGroupId) {
        // Fallback: intentar obtenerlo de la URL actual si la variable está vacía
        const parts = this.router.url.split('/');
        this.currentGroupId = parts[parts.length - 1];
    }

    if(confirm('¿Estás seguro de que quieres borrar este chat? Esta acción no se puede deshacer.')) {
        this.groupService.deleteGroup(this.currentGroupId!).subscribe({
            next: () => {
                // Redirigir a home o friends
                this.router.navigate(['/home/friends']);
                // Limpiar observables visuales
                this.groupService.setTopic('');
                this.groupService.setGroupImgUrl('');
            },
            error: (err) => console.error('Error deleting chat', err)
        });
    }
  }
}