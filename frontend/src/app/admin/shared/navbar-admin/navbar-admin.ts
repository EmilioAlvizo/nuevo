import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-admin',
  imports: [],
  templateUrl: './navbar-admin.html',
  styleUrl: './navbar-admin.css'
})
export class NavbarAdmin {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Sesión cerrada');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        // Aún así redirigir
        this.router.navigate(['/login']);
      }
    });
  }
}
