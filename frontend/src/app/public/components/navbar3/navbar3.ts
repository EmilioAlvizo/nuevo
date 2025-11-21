// nuevo/frontend/src/app/public/components/navbar3/navbar3.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  input,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TopBar } from '../../../admin/shared/top-bar/top-bar';
import { filter } from 'rxjs/operators';

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
  dropdownOpenId = signal<string | null>(null);
  topBarExpanded = signal(false);

  private routeChanged = signal(0);

  // 🆕 Mapa de rutas por dropdown
private dropdownRoutes = {
  juventudes: ['/sistema-juventudes', '/consejo'],
  informacion: ['/directorio']
};

  // Internos
  private clickOutsideHandler?: () => void;
  private scrollHandler?: () => void;
  private lastScrollTop = 0;
  private ticking = false;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(
  private el: ElementRef, 
  private renderer: Renderer2,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}

  // 🆕 effect que previene scroll del body
  private preventBodyScrollEffect = effect(() => {
    if (typeof document === 'undefined') return;

    const isOpen = this.mobileMenuOpen();
    document.body.classList.toggle('mobile-menu-open', isOpen);
  });

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

  this.router.events
    .pipe(filter(ev => ev instanceof NavigationEnd))
    .subscribe(() => {
      this.routeChanged.update(v => v + 1); // Actualizar signal
      this.cdr.markForCheck(); // Forzar detección de cambios
    });

  }

  ngOnDestroy(): void {
    this.clickOutsideHandler?.();
    this.scrollHandler?.();
    clearTimeout(this.debounceTimer);

    // Remover clase del body
    if (typeof document !== 'undefined') {
      document.body.classList.remove('mobile-menu-open');
    }
  }

  private handleScroll(): void {
    if (this.topBarExpanded()) {
      this.isScrolled.set(false);
      this.showTopBar.set(true);
      return;
    }

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

  // 🆕 Verificar si un dropdown tiene una ruta activa
isDropdownActive(id: string): boolean {
  this.routeChanged(); // Lee el signal para activar detección
  const routes = this.dropdownRoutes[id as keyof typeof this.dropdownRoutes];
  if (!routes) return false;
  
  const currentUrl = this.router.url;
  return routes.some(route => currentUrl.startsWith(route));
}


  onTopBarExpanded(expanded: boolean) {
    this.topBarExpanded.set(expanded);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);

    if (!this.mobileMenuOpen()) {
      this.dropdownOpen.set(false);
    }

    console.log('📱 [NAVBAR] Menú móvil:', this.mobileMenuOpen() ? 'Abierto' : 'Cerrado');
  }

  // toggleDropdown(event: Event): void {
  //   event.stopPropagation();
  //   this.dropdownOpen.update((open) => !open);
  //   console.log('📋 [NAVBAR] Dropdown:', this.dropdownOpen() ? 'Abierto' : 'Cerrado');
  // }
  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    
    this.dropdownOpenId.update(current =>
      current === id ? null : id
    );

    console.log("📋 Dropdown abierto:", this.dropdownOpenId());
  }

  isOpen(id: string) {
    return this.dropdownOpenId() === id;
  }


  closeMenu(): void {
    console.log('🔒 [NAVBAR] Cerrando todo');
    this.mobileMenuOpen.set(false);
    this.dropdownOpenId.set(null);
  }

  onLinkClick(): void {
    console.log('🔗 [NAVBAR] Navegando, cerrando menú');
    this.closeMenu();
  }
}
