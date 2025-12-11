import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notificacion';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-admin.html',
  styleUrls: ['./home-admin.css']
})
export class HomeAdmin implements OnInit {

  private authService = inject(AuthService);
  private notifs = inject(NotificationService);

  // Signals locales
  currentUser = signal<User | null>(null);

  // Notificaciones reactivas (signal readonly)
  notificaciones = this.notifs.notificaciones;

  ngOnInit(): void {
    // Actualizar el signal local a partir del AuthService
    this.currentUser.set(this.authService.currentUser());
  }

  get nombreAdmin(): string {
    return this.currentUser()?.nombre || 'Administrador';
  }

  marcarRecibida(id: number) {
    this.notifs.marcarComoLeida(id);
  }

}
