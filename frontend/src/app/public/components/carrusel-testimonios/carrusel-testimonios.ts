import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { Testimonios } from '../../../core/services/testimonios';

@Component({
  selector: 'app-carrusel-testimonios',
  imports: [CommonModule, CarouselModule, ButtonModule],
  templateUrl: './carrusel-testimonios.html',
  styleUrl: './carrusel-testimonios.css',
})
export class CarruselTestimonios {
  @Input() testimonios: Testimonios[] = [];
  @Input() publicUrl: string = '';

  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '1199px',
      numVisible: 1,
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
