// nuevo/frontend/src/app/public/components/navbar3/navbar3.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TopBar } from '../../../admin/shared/top-bar/top-bar'

@Component({
  selector: 'app-navbar3',
  imports: [CommonModule, NgOptimizedImage, RouterModule, TopBar],
  templateUrl: './navbar3.html',
  styleUrl: './navbar3.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.scrolled]': 'isScrolled()',
    '[class.menu-open]': 'mobileMenuOpen()', // 🆕 Clase en el host
  },
})
export class Navbar3 implements OnInit, OnDestroy {
  publicUrl = environment.publicUrl;
  
  // Inputs configurables
  brandLink = input('/');
  scrollThreshold = input(50);

  // Signals
  showTopBar = signal(true);
  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  dropdownOpen = signal(false);

  // Internos
  private clickOutsideHandler?: () => void;
  private scrollHandler?: () => void;
  private lastScrollTop = 0;
  private ticking = false;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Detectar clic fuera del dropdown
    this.clickOutsideHandler = this.renderer.listen('document', 'click', (event) => {
      const insideDropdown = (event.target as HTMLElement).closest('.nav-dropdown');
      if (!insideDropdown) this.dropdownOpen.set(false);
    });

    // Escuchar scroll solo si hay ventana
    if (typeof window !== 'undefined') {
      this.scrollHandler = this.renderer.listen('window', 'scroll', () => {
        this.handleScroll();
      });
    }

    // 🆕 Prevenir scroll cuando el menú móvil está abierto
    this.preventBodyScroll();
  }

  ngOnDestroy(): void {
    this.clickOutsideHandler?.();
    this.scrollHandler?.();
    clearTimeout(this.debounceTimer);
    
    // 🆕 Limpiar la clase del body al destruir
    if (typeof document !== 'undefined') {
      document.body.classList.remove('movile-menu-open');
    }
  }

  private handleScroll(): void {
    if (this.ticking) return;
    this.ticking = true;

    requestAnimationFrame(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const threshold = this.scrollThreshold();
      const tolerance = 60;

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const shouldShowTopBar = scrollTop < threshold - tolerance;
        const shouldBeScrolled = scrollTop > threshold + tolerance;

        if (shouldShowTopBar !== this.showTopBar()) {
          this.showTopBar.set(shouldShowTopBar);
        }

        if (shouldBeScrolled !== this.isScrolled()) {
          this.isScrolled.set(shouldBeScrolled);
        }

        this.lastScrollTop = scrollTop;
      }, 80);

      this.ticking = false;
    });
  }

  // 🆕 Prevenir scroll del body cuando el menú está abierto
  private preventBodyScroll(): void {
    if (typeof document === 'undefined') return;

    const body = document.body;
    
    // Observar cambios en mobileMenuOpen
    const checkMenuState = () => {
      if (this.mobileMenuOpen()) {
        body.classList.add('mobile-menu-open');
      } else {
        body.classList.remove('movile-menu-open');
      }
    };

    // Ejecutar cada vez que cambie el signal
    setInterval(checkMenuState, 50);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
    
    // 🆕 Cerrar dropdown al cerrar menú móvil
    if (!this.mobileMenuOpen()) {
      this.dropdownOpen.set(false);
    }
    
    console.log('📱 [NAVBAR] Menú móvil:', this.mobileMenuOpen() ? 'Abierto' : 'Cerrado');
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((open) => !open);
    console.log('📋 [NAVBAR] Dropdown:', this.dropdownOpen() ? 'Abierto' : 'Cerrado');
  }

  closeMenu(): void {
    console.log('🔒 [NAVBAR] Cerrando todo');
    this.mobileMenuOpen.set(false);
    this.dropdownOpen.set(false);
  }

  // 🆕 Cerrar menú al navegar
  onLinkClick(): void {
    console.log('🔗 [NAVBAR] Navegando, cerrando menú');
    this.closeMenu();
  }
}