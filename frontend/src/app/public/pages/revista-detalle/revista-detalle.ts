// nuevo/frontend/src/app/public/pages/revista-detalle/revista-detalle.ts
import {
  Component,
  ChangeDetectionStrategy,
  LOCALE_ID,
  effect,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { Flipbook } from '../../components/flipbook/flipbook';
import { environment } from '../../../../environments/environment';

registerLocaleData(localeEs);

@Component({
  selector: 'app-revista-detalle',
  standalone: true,
  imports: [CommonModule, Flipbook, RouterModule],
  templateUrl: './revista-detalle.html',
  styleUrls: ['./revista-detalle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
})
export class RevistaDetalle {
  private route = inject(ActivatedRoute);
  private apiRevistas = inject(ApiRevistas);
  private apiArticulos = inject(ApiArticulos);

  // Data Signals
  revista = signal<Revistas | null>(null);
  articulos = signal<Articulos[]>([]);
  cargandoArticulos = signal(false);

  // URL Signal
  idRevista = signal<number | null>(null);

  publicUrl = environment.publicUrl;

  // View Child Signal
  flipbookRef = viewChild(Flipbook);

  constructor() {
    this.idRevista.set(Number(this.route.snapshot.paramMap.get('id')));

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

  private cargarArticulos(id: number) {
    this.cargandoArticulos.set(true);
    this.apiArticulos.getArticulos().subscribe({
      next: (response) => {
        const filtrados = response.data.filter((a) => a.id_revista === id && a.estatus === 'A');
        this.articulos.set(filtrados);
        this.cargandoArticulos.set(false);
      },
      error: () => this.cargandoArticulos.set(false),
    });
  }

  descargarPDF(): void {
    const r = this.revista();
    if (!r) return;
    const ruta = `${this.publicUrl}/revistas/${r.id_revista}/archivo/${r.archivo}`;
    window.open(ruta, '_blank');
  }

  abrirFlipbookEnPagina(pagina: number | null) {
    if (!pagina) return;

    const flipbook = this.flipbookRef();
    if (!flipbook) {
      console.error('Flipbook component not ready');
      return;
    }

    // Ahora Flipbook.goToPage contiene TU lógica original de cálculo de folios
    flipbook.goToPage(pagina);

    // Restaurar el comportamiento de scroll suave del original
    setTimeout(() => {
      // Intentamos buscar por clase wrapper o stage
      const flipbookEl =
        document.querySelector('.flipbook-wrapper') || document.querySelector('.book-stage');
      if (flipbookEl) {
        flipbookEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}
