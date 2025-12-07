// nuevo/frontend/src/app/public/components/carrusel-revista/carrusel-revista.ts
import { Component, OnInit, inject, Input } from '@angular/core';
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
  selector: 'app-carrusel-revista',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, CarouselModule, ButtonModule, TagModule, DividerModule],
  templateUrl: './carrusel-revista.html',
  styleUrl: './carrusel-revista.css',
})
export class CarruselRevista implements OnInit {
  // Inyección de dependencias (Angular 16+)
  private srvRevistas = inject(ApiRevistas);
  private srvArticulos = inject(ApiArticulos);

  @Input() revistas: RevistaVisual[] = [];
  responsiveOptions: any[] | undefined;
  loading: boolean = true;

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
    this.loading = true;

    // Usamos forkJoin para lanzar ambas peticiones en paralelo
    forkJoin({
      revistasData: this.srvRevistas.getRevistas(), // O getFiltrados({estatus: 'A'})
      articulosData: this.srvArticulos.getArticulos(),
    })
      .pipe(
        map((response) => {
          const revistas = response.revistasData.data || [];
          const todosArticulos = response.articulosData.data || [];

          // AQUÍ OCURRE LA MAGIA: Unimos las tablas en el frontend
          return revistas.map((revista) => {
            // Buscamos los artículos que pertenecen a esta revista
            const articulosDeRevista = todosArticulos.filter(
              (art) => art.id_revista === revista.id_revista
            );

            // Retornamos el objeto combinado
            return {
              ...revista,
              articulos: articulosDeRevista,
            } as RevistaVisual;
          });
        })
      )
      .subscribe({
        next: (datosCombinados) => {
          // Filtramos solo las activas si es necesario, u ordenamos por fecha descendente
          this.revistas = datosCombinados.sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando catálogo:', err);
          this.loading = false;
        },
      });
  }

  getSeverity(estatus: string) {
    return estatus === 'A' ? 'success' : 'secondary';
  }


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
        color: '#00000'
      }
    }
  }; 

  /* carouselDesignTokens = {
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
  }; */

  dividerDesignTokens = {
    root: {
      borderColor: 'var(--surface-border)', // Se adapta a gris claro u oscuro
    },
    horizontal: {
      margin: '0 0 1.125rem 0'
    }
  };
}
