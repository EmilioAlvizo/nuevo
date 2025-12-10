// nuevo/frontend/src/app/public/pages/revista-detalle/revista-detalle.ts
import {
  Component,
  ChangeDetectionStrategy,
  LOCALE_ID,
  effect,
  signal,
  inject,
} from '@angular/core';
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
  imports: [CommonModule, Flipbook, RouterModule],
  templateUrl: './revista-detalle.html',
  styleUrls: ['./revista-detalle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
})
export class RevistaDetalle {
  // ------------------
  // Signals
  // ------------------

  private route = inject(ActivatedRoute);
  private apiRevistas = inject(ApiRevistas);
  private apiArticulos = inject(ApiArticulos);

  revista = signal<Revistas | null>(null);
  articulos = signal<Articulos[]>([]);
  cargandoArticulos = signal(false);

  publicUrl = environment.publicUrl;

  @ViewChild(Flipbook)
  flipbookComponent!: Flipbook;

  // ID de la URL como signal
  idRevista = signal<number | null>(null);

  constructor() {
    // Cargar ID desde la URL al inicializar
    this.idRevista.set(Number(this.route.snapshot.paramMap.get('id')));

    // Efecto: cuando cambia el ID → cargar revista
    effect(() => {
      const id = this.idRevista();
      if (!id) return;

      this.apiRevistas.getRevistas().subscribe((response) => {
        const encontrada = response.data.find((r) => r.id_revista === id) ?? null;
        this.revista.set(encontrada);

        if (encontrada) this.cargarArticulos(id);
      });
    });
  }

  // ------------------
  // Cargar artículos
  // ------------------

  private cargarArticulos(id: number) {
    this.cargandoArticulos.set(true);

    this.apiArticulos.getArticulos().subscribe({
      next: (response) => {
        const filtrados = response.data.filter((a) => a.id_revista === id && a.estatus === 'A');

        this.articulos.set(filtrados);
        this.cargandoArticulos.set(false);
      },
      error: () => {
        this.cargandoArticulos.set(false);
      },
    });
  }

  // ------------------
  // Abrir PDF
  // ------------------

  descargarPDF(): void {
    const r = this.revista();
    if (!r) return;

    const ruta = `${this.publicUrl}/revistas/${r.id_revista}/archivo/${r.archivo}`;
    window.open(ruta, '_blank');
  }

  // ------------------
  // Abrir flipbook en página
  // ------------------

  abrirFlipbookEnPagina(pagina: number | null) {
    console.log('Intentando abrir página:', pagina);
    // Validaciones básicas
    if (!pagina || !this.flipbookComponent) {
      console.error('El componente Flipbook no está inicializado o no se encontró en el DOM.');
      return;
    }

    // 1. Delegar la lógica al componente hijo
    this.flipbookComponent.goToPage(pagina);

    // 2. Hacer scroll hacia el visor
    setTimeout(() => {
      // Asegúrate que en tu HTML exista un elemento con clase 'flipbook-wrapper' o usa el ID del stage
      const flipbookEl = document.querySelector('.book-stage');
      if (flipbookEl) {
        flipbookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}
