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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { NavbarAdmin2 } from '../../../admin/shared/navbar-admin2/navbar-admin2'

@Component({
  selector: 'app-navbar3',
  imports: [CommonModule, RouterModule, NavbarAdmin2],
  templateUrl: './navbar3.html',
  styleUrl: './navbar3.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.scrolled]': 'isScrolled()',
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
  }

  ngOnDestroy(): void {
    this.clickOutsideHandler?.();
    this.scrollHandler?.();
    clearTimeout(this.debounceTimer);
  }

  private handleScroll(): void {
    if (this.ticking) return;
    this.ticking = true;

    requestAnimationFrame(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const threshold = this.scrollThreshold();
      const tolerance = 60; // Histeresis: evita parpadeos cerca del umbral
      console.log('scroll ',scrollTop)

      // Actualizar estado con debounce
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
      }, 80); // 80ms debounce

      this.ticking = false;
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
    if (!this.mobileMenuOpen()) this.dropdownOpen.set(false);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
    this.dropdownOpen.set(false);
  }
}
