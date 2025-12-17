// nuevo/frontend/src/app/admin/shared/top-bar/top-bar.ts
import {
  Component,
  inject,
  input,
  Renderer2,
  signal,
  computed, // Importar computed
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // User ya se infiere
import { NotificationService, Notificacion } from '../../../core/services/notificacion';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBar implements OnInit, OnDestroy {
  // Services
  private readonly notifs = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);

  // Inputs & Outputs
  show = input(true);
  expandedChange = output<boolean>();
  isExpanded = false;

  // ✅ SIGNALS: Conectados directamente al Service (Reactividad automática)
  // No necesitas crear un signal local y actualizarlo manualmente.
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;

    // Signal derivado para contador de notificaciones no leídas
  contadorNotificaciones = computed(() => this.notifs.contadorNoLeidas);
  // Signal derivado para mostrar lista de notificaciones
  notificaciones = this.notifs.notificaciones; // ya es readonly signal

  // ✅ COMPUTED: Derivado del signal de usuario
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');

  // Estado local UI
  showAdminMenu = signal(false);
  openSection = signal<number | null>(null);

  // Handlers
  private clickOutsideHandler?: () => void;

  ngOnInit(): void {
    // ✅ Detectar clic fuera del menú admin para cerrarlo
    // this.clickOutsideHandler = this.renderer.listen('document', 'click', (event) => {
    //   const insideAdminBtn = (event.target as HTMLElement).closest('.admin-btn');
    //   const insideAdminMenu = (event.target as HTMLElement).closest('.admin-menu');

    //   if (!insideAdminBtn && !insideAdminMenu) {
    //     if (this.showAdminMenu()) {
    //       this.showAdminMenu.set(false);
    //     }
    //   }
    // });


    this.clickOutsideHandler = this.renderer.listen('document', 'click', (event) => {
      const target = event.target as HTMLElement;

      // ===== ADMIN MENU =====
      const insideAdminBtn = target.closest('.admin-btn');
      const insideAdminMenu = target.closest('.admin-menu');

      if (!insideAdminBtn && !insideAdminMenu && this.showAdminMenu()) {
        this.showAdminMenu.set(false);
      }

      // ===== NOTIFICACIONES =====
      const insideNotifBtn = target.closest('.notif-btn');
      const insideNotifDropdown = target.closest('.notif-dropdown');

      if (!insideNotifBtn && !insideNotifDropdown && this.showNotifDropdown()) {
        this.showNotifDropdown.set(false);
      }
    });

  }

  ngOnDestroy(): void {
    this.clickOutsideHandler?.();
    // No hace falta destruir suscripciones de Auth porque ya no existen
  }

  // ==================== METHODS ====================

  toggleAdminMenu(event: Event): void {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
    this.expandedChange.emit(this.isExpanded);
    this.showAdminMenu.update((open) => !open);
  }

  closeAdminMenu(): void {
    this.showAdminMenu.set(false);
    this.isExpanded = false;
    this.expandedChange.emit(this.isExpanded);
  }

  goToLogin(): void {
    this.closeAdminMenu();
    this.router.navigate(['/login']);
  }

  logout(): void {
    // Logout sigue devolviendo un Observable (petición HTTP), así que .subscribe está bien aquí
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

  toggleSection(index: number) {
    if (this.openSection() === index) {
      this.openSection.set(null);
    } else {
      this.openSection.set(index);
    }
  }

  showNotifDropdown = signal(false);

  toggleNotifDropdown() {
    this.showNotifDropdown.update(v => !v);
  }

  marcarComoLeida(notif: Notificacion) {
    this.notifs.marcarComoLeida(notif.id);
  }

  marcarTodasComoLeidas() {
    this.notifs.marcarTodasComoLeidas();
  }

}
