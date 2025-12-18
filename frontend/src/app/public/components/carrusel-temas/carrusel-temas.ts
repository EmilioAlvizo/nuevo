import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { Temas } from '../../../core/services/temas_interes';

@Component({
  selector: 'app-carrusel-temas',
  imports: [CommonModule, CarouselModule, ButtonModule],
  templateUrl: './carrusel-temas.html',
  styleUrl: './carrusel-temas.css',
})
export class CarruselTemas {
  @Input() temas: Temas[] = [];
  @Input() publicUrl: string = '';

  // 1. Creamos 4 items falsos para rellenar la vista desktop
  skeletonItems = new Array(4).fill({ id_tema: -1 });

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

