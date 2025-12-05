// frontend/src/app/public/components/carrusel-testimonios/carrusel-testimonios.ts
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { Testimonios } from '../../../core/services/testimonios';


@Component({
  selector: 'app-carrusel-testimonios',
  imports: [CommonModule, NgOptimizedImage, CarouselModule, ButtonModule],
  templateUrl: './carrusel-testimonios.html',
  styleUrl: './carrusel-testimonios.css',
  encapsulation: ViewEncapsulation.None
})
export class CarruselTestimonios {
  @Input() testimonios: Testimonios[] = [];
  @Input() publicUrl: string = '';

  // 1. Creamos 4 items falsos para rellenar la vista desktop
  skeletonItems = new Array(4).fill({ id_testimonios: -1 });

  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 1,
    },
    {
      breakpoint: '1199px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: '575px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  // Personalización con Design Tokens de PrimeNG
  carouselDesignTokens = {
    indicator: {
      width: '2rem',
      height: '0.5rem',
      borderRadius: '1rem',
      background: '#d1d5db',
      hoverBackground: '#9ca3af',
      activeBackground: '#3b82f6',
      focusRing: {
        width: '2px',
        color: '#3b82f680'
      }
    }
  };
}
