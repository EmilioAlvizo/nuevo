// nuevo/frontend/src/app/public/pages/revista-detalle/revista-detalle.ts
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { Flipbook } from '../../components/flipbook/flipbook';
import localeEs from '@angular/common/locales/es';
import { environment } from '../../../../environments/environment';
import { RouterModule } from '@angular/router';
import { ViewChild } from '@angular/core';

registerLocaleData(localeEs);


@Component({
  selector: 'app-revista-detalle',
  standalone: true,
  imports: [CommonModule, Flipbook, RouterModule],
  templateUrl: './revista-detalle.html',
  styleUrls: ['./revista-detalle.css'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }] 
})

export class RevistaDetalle implements OnInit {
  @ViewChild(Flipbook) flipbookComponent!: Flipbook;

  publicUrl = environment.publicUrl;

  revista?: Revistas;
  articulos: Articulos[] = [];   // ← agregar array de artículos
  cargandoArticulos = false;      // ← para mostrar loading opcional

  constructor(
    private route: ActivatedRoute,
    private apiRevistas: ApiRevistas,
    private apiArticulos: ApiArticulos
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.obtenerRevista(+id);
  }

  obtenerRevista(id: number): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (response) => {
        const encontrada = response.data.find(r => r.id_revista === id);
        if (encontrada) {
          this.revista = encontrada;
          this.obtenerArticulosPorRevista(id);
        }
      },
      error: (err) => console.error('Error al obtener detalle:', err)
    });
  }

  obtenerArticulosPorRevista(id: number): void {
    this.cargandoArticulos = true;
    this.apiArticulos.getArticulos().subscribe({
      next: (response) => {
        // Filtrar solo los artículos de la revista actual **y** con estatus 'A'
        this.articulos = response.data
          .filter(a => a.id_revista === id && a.estatus === 'A');
        this.cargandoArticulos = false;
      },
      error: (err) => {
        console.error('Error al obtener artículos:', err);
        this.cargandoArticulos = false;
      }
    });
  }


  descargarPDF(): void {
    if (this.revista?.archivo && this.revista?.id_revista) {
      const ruta = `http://localhost:3000/public/revistas/${this.revista.id_revista}/archivo/${this.revista.archivo}`;
      window.open(ruta, '_blank');
    } else {
      console.error('Archivo o ID de revista no definidos');
    }
  }

  abrirFlipbookEnPagina(pagina: number | null) {
    if (pagina === null || !this.flipbookComponent) return;

    // Calcular el índice del folio considerando que la portada (página 1) está sola
    let folioIndex: number;
    
    if (pagina === 1) {
      // La portada está en el folio 0
      folioIndex = 0;
    } else {
      // Páginas 2 en adelante: página 2-3 → folio 1, página 4-5 → folio 2, etc.
      folioIndex = Math.floor((pagina - 2) / 2) + 1;
    }
    
    // Verificar que el folio existe
    if (folioIndex < 0 || folioIndex >= this.flipbookComponent.folios.length) {
      console.error('Índice de folio fuera de rango:', folioIndex);
      return;
    }

    // Marcar los folios anteriores como "flipped"
    for (let i = 0; i < folioIndex; i++) {
      this.flipbookComponent.folios[i].flipped = true;
    }

    // Asegurarse de que el folio actual NO esté flipped
    this.flipbookComponent.folios[folioIndex].flipped = false;

    // Actualizar el índice actual
    this.flipbookComponent.currentFolioIndex = folioIndex;

    // Renderizar los folios visibles
    this.flipbookComponent.renderVisibleFolios();

    // Scroll hacia el flipbook después de un pequeño delay
    setTimeout(() => {
      const flipbookEl = document.querySelector('.flipbook-wrapper');
      if (flipbookEl) {
        flipbookEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

}
