import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar implements OnInit{
  private authService = inject(AuthService);
  
  title = 'Sistema de Autenticación';

  ngOnInit(): void {
    console.log('🚀 [APP] Aplicación iniciada');
    
    // Suscribirse a cambios de usuario para logging (opcional)
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('👤 [APP] Usuario actual:', user.nombre, `(${user.rol})`);
      } else {
        console.log('👤 [APP] No hay usuario autenticado');
      }
    });
  }
}
