// nuevo/frontend/src/app/public/components/carrusel-revista/carrusel-revista.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, CarouselModule, ButtonModule, TagModule, DividerModule],
  templateUrl: './carrusel-revista.html',
  styleUrl: './carrusel-revista.css',
})
export class CarruselRevista implements OnInit {
  // Inyección de dependencias (Angular 16+)
  private srvRevistas = inject(ApiRevistas);
  private srvArticulos = inject(ApiArticulos);

  revistas: RevistaVisual[] = [];
  responsiveOptions: any[] | undefined;
  loading: boolean = true;

  // AJUSTA ESTO: La ruta pública donde tu backend sirve las imágenes subidas
  // Ejemplo: si tu backend es Node/Express, suele ser 'http://localhost:3000/public/'
  baseImageUrl = `${environment.publicUrl}/revistas`;

  ngOnInit() {
    this.configurarCarrusel();
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
}
