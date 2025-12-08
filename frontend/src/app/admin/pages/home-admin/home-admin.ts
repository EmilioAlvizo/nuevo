// import { Component, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AuthService, User } from '../../../core/services/auth.service';

// @Component({
//   selector: 'app-home-admin',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './home-admin.html',
//   styleUrls: ['./home-admin.css']
// })
// export class HomeAdmin implements OnInit {

//   private authService = inject(AuthService);

//   // Signal para almacenar el usuario actual
//   currentUser = signal<User | null>(null);

//   ngOnInit(): void {
//     this.authService.currentUser$.subscribe(user => {
//       this.currentUser.set(user);
//       console.log('👋 [HOME-ADMIN] Usuario actual:', user?.nombre || 'Admin');
//     });
//   }

//   get nombreAdmin(): string {
//     return this.currentUser()?.nombre || 'Administrador';
//   }
// }

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notificacion';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-admin.html',
  styleUrls: ['./home-admin.css']
})
export class HomeAdmin implements OnInit {

  private authService = inject(AuthService);
  private notifs = inject(NotificationService);

  currentUser = signal<User | null>(null);

  // Notificaciones reactivas (signal readonly)
  notificaciones = this.notifs.notificaciones;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  get nombreAdmin(): string {
    return this.currentUser()?.nombre || 'Administrador';
  }

  marcarRecibida(id: number) {
    this.notifs.marcarComoLeida(id);
  }
}
