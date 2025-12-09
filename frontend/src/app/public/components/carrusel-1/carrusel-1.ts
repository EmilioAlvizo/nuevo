// nuevo/frontend/src/app/public/components/carrusel-1/carrusel-1.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

// PrimeNG
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Servicios e Interfaces
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaz visual extendida (combina Revista + sus Artículos)
export interface RevistaVisual extends Revistas {
  articulos: Articulos[];
}

@Component({
  selector: 'app-carrusel-1',
  imports: [CommonModule, NgOptimizedImage, CarouselModule, ButtonModule, TagModule, DividerModule],
  templateUrl: './carrusel-1.html',
  styleUrl: './carrusel-1.css',
})
export class Carrusel1 {
  private srvRevistas = inject(ApiRevistas);
  private srvArticulos = inject(ApiArticulos);

  responsiveOptions: any[] | undefined;
  revistas = signal<RevistaVisual[]>([]);
  loading = signal(true);

  // AJUSTA ESTO: La ruta pública donde tu backend sirve las imágenes subidas
  // Ejemplo: si tu backend es Node/Express, suele ser 'http://localhost:3000/public/'
  baseImageUrl = `${environment.publicUrl}/revistas`;

  ngOnInit() {
    //this.configurarCarrusel();
    this.cargarDatosReales();
  }

  configurarCarrusel() {
    this.responsiveOptions = [
      { breakpoint: '1199px', numVisible: 1, numScroll: 1 },
      { breakpoint: '991px', numVisible: 1, numScroll: 1 },
      { breakpoint: '767px', numVisible: 1, numScroll: 1 },
    ];
  }

  cargarDatosReales() {
    this.loading.set(true);

    // Usamos forkJoin para lanzar ambas peticiones en paralelo
    forkJoin({
      revistasData: this.srvRevistas.getFiltrados({
        estatus: ['A'],
        limite: 1,
        pagina: 1,
        sortField: 'fecha',
        sortOrder: -1
      }),
      articulosData: this.srvArticulos.getArticulos(),
    })
      .pipe(
        map((response) => {
          const revistas = response.revistasData.data ?? [];
          const articulos = response.articulosData.data ?? [];

          return revistas
            .map((rev) => ({
              ...rev,
              articulos: articulos.filter((a) => a.id_revista === rev.id_revista),
            }))
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        })
      )
      .subscribe({
        next: (resultado) => {
          this.revistas.set(resultado);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getSeverity(estatus: string) {
    return estatus === 'A' ? 'success' : 'secondary';
  }

  /* carouselDesignTokens = {
    indicator: {
      width: '2rem',
      height: '0.5rem',
      borderRadius: '1rem',
      background: '#d1d5db',
      hoverBackground: '#9ca3af',
      activeBackground: '#3b82f6',
      focusRing: {
        width: '2px',
        color: '#00000',
      },
    },
  }; */

  carouselDesignTokens = {
    indicator: {
      width: '2rem',
      height: '0.5rem',
      borderRadius: '1rem',
      
      // Fondo inactivo: Un gris medio que funciona en ambos modos
      background: 'var(--surface-300)', 
      
      // Hover: Un poco más oscuro/claro según el tema
      hoverBackground: 'var(--surface-400)', 
      
      // Activo: El color primario de tu tema (azul, verde, etc.)
      activeBackground: 'var(--primary-color)', 
      
      focusRing: {
        width: '2px',
        color: 'var(--primary-color-text)' // O una opacidad del primario
      }
    }
  };

  dividerDesignTokens = {
    /* root: {
      borderColor: 'var(--surface-border)', // Se adapta a gris claro u oscuro
    }, */
    horizontal: {
      margin: '0 0 1.125rem 0',
    },
  };
}
