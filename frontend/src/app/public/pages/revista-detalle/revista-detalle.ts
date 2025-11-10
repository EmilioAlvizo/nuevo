import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { Flipbook } from '../../components/flipbook/flipbook';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);


@Component({
  selector: 'app-revista-detalle',
  standalone: true,
  imports: [CommonModule, Flipbook],
  templateUrl: './revista-detalle.html',
  styleUrls: ['./revista-detalle.css'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }] 
})

export class RevistaDetalle implements OnInit {

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

}
