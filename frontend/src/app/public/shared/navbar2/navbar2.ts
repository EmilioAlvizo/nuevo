import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar2',
  imports: [RouterModule],
  templateUrl: './navbar2.html',
  styleUrl: './navbar2.css'
})
export class Navbar2 implements OnInit, OnDestroy{
  // Estados reactivos (Angular 20)
  showTopBar = true;
  mobileMenuOpen = false;
  dropdownOpen = false;

  private clickOutsideHandler!: () => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Detectar clic fuera del dropdown
    this.clickOutsideHandler = this.renderer.listen('document', 'click', (event) => {
      const insideDropdown = event.target.closest('.nav-dropdown');
      if (!insideDropdown) {
        this.dropdownOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clickOutsideHandler) this.clickOutsideHandler();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // Ocultar barra superior con scroll
  @HostListener('window:scroll')
  onScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    /* console.log('Scroll position:', scrollTop); */
    this.showTopBar = scrollTop < 50;
  }
}
