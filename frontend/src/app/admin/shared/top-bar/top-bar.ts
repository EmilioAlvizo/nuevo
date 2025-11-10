import {
  Component,
  inject,
  input,
  Renderer2,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  // Services
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private destroy$ = new Subject<void>();

  // Inputs configurables
  show = input(true); // Control externo de visibilidad

  // Signals
  currentUser = signal<User | null>(null);
  showAdminMenu = signal(false);

  // Handlers
  private clickOutsideHandler?: () => void;

  async ngOnInit(): Promise<void> {
    // Suscribirse a cambios de autenticación
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser.set(user);
      console.log('👤 [TOP-BAR] Usuario actualizado:', user?.email || 'No autenticado');
    });

    // ✅ Detectar clic fuera del menú admin para cerrarlo
    this.clickOutsideHandler = this.renderer.listen('document', 'click', (event) => {
      // Verificar si el clic fue dentro del botón admin o del menú desplegable
      const insideAdminBtn = (event.target as HTMLElement).closest('.admin-btn');
      const insideAdminMenu = (event.target as HTMLElement).closest('.admin-menu');

      // Si el clic fue fuera de ambos, cerrar el menú
      if (!insideAdminBtn && !insideAdminMenu) {
        if (this.showAdminMenu()) {
          console.log('🔒 [TOP-BAR] Cerrando menú admin (clic fuera)');
          this.showAdminMenu.set(false);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.clickOutsideHandler?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== GETTERS ====================

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  get isAdmin(): boolean {
    return this.currentUser()?.rol === 'admin';
  }

  // ==================== METHODS ====================

  toggleAdminMenu(event: Event): void {
    event.stopPropagation();
    this.showAdminMenu.update((open) => !open);
  }

  closeAdminMenu(): void {
    this.showAdminMenu.set(false);
  }

  goToLogin(): void {
    this.closeAdminMenu();
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.showAdminMenu.set(false);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Error al cerrar sesión:', error);
      },
    });
  }
}
