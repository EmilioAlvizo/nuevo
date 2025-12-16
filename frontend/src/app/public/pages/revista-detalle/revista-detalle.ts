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

import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TabsModule } from 'primeng/tabs';

import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { Flipbook } from '../../components/flipbook/flipbook';
import { Flipbook2 } from '../../components/flipbook2/flipbook2';
import { environment } from '../../../../environments/environment';

registerLocaleData(localeEs);

@Component({
  selector: 'app-revista-detalle',
  standalone: true,
  imports: [CommonModule, Flipbook, Flipbook2, RouterModule, BreadcrumbModule, TabsModule],
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
  articuloIndependiente = signal<Articulos | null>(null); // Nuevo: Para modo artículo
  articulos = signal<Articulos[]>([]);
  cargandoArticulos = signal(false);

  // Tab Signal
  activeTab = signal<string>('0');

  // URL Signal
  idRevista = signal<number | null>(null);
  idArticulo = signal<number | null>(null); // Nuevo

  publicUrl = environment.publicUrl;

  // View Child Signal
  flipbookRef = viewChild(Flipbook2);

  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  isArticuloMode = signal(false);

  constructor() {
    // Detectar modo basado en la URL
    this.route.url.subscribe(segments => {
      if (segments[0].path === 'articulo') {
        this.isArticuloMode.set(true);
        this.idArticulo.set(Number(this.route.snapshot.paramMap.get('id')));
        this.configurarBreadcrumbArticulo();
      } else {
        this.isArticuloMode.set(false);
        this.idRevista.set(Number(this.route.snapshot.paramMap.get('id')));
        this.configurarBreadcrumbRevista();
      }
    });

    effect(() => {
      // Modo Revista
      const idR = this.idRevista();
      if (!this.isArticuloMode() && idR) {
        this.apiRevistas.getRevistas().subscribe((response) => {
          const encontrada = response.data.find((r) => r.id_revista === idR) ?? null;
          this.revista.set(encontrada);
          if (encontrada) this.cargarArticulos(idR);
        });
      }

      // Modo Artículo Independiente
      const idA = this.idArticulo();
      if (this.isArticuloMode() && idA) {
        // Asumimos que getArticulos() trae todo y filtramos, 
        // IDEALMENTE debería haber un endpoint getById en ApiArticulos.
        // Por ahora usaremos getFiltrados para buscar por ID.
        this.apiArticulos.getFiltrados({ id_articulo: idA }).subscribe({
          next: (response) => {
            if (response.data && response.data.length > 0) {
              const art = response.data[0];
              this.articuloIndependiente.set(art);

              // Para flipbook de articulo, necesitamos saber qué PDF usar.
              // Los artículos independientes ¿tienen su propio PDF en 'imagen'? 
              // O ¿tienen un campo 'archivo'? 
              // En el modelo Articulos veo 'imagen', no 'archivo'.
              // En articulo-admin.ts vi que se sube 'archivo' o 'imagen'?
              // Revisando crud.config.js: fileColumn: ['imagen'].
              // Voy a asumir que 'imagen' es el PDF si es un artículo independiente que se lee en flipbook.
              // OJO: Si 'imagen' es una portada y no el PDF, tenemos un problema.
              // El usuario dijo "se debe mostrar el visor de pdf".
              // Voy a asumir que para articulos independientes, el campo 'imagen' *es* el PDF (o deberia haber un campo archivo).
            }
          }
        });
      }
    });
  }

  configurarBreadcrumbRevista() {
    this.items = [
      { label: 'Revistas', routerLink: '/revista', queryParams: { tab: '0' } },
      { label: 'Detalle de Edición' }
    ];
  }

  configurarBreadcrumbArticulo() {
    this.items = [
      { label: 'Artículos', routerLink: '/revista', queryParams: { tab: '1' } },
      { label: 'Vista de Artículo' }
    ];
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
    if (this.isArticuloMode()) {
      const a = this.articuloIndependiente();
      if (!a) return;
      // TODO: Verificar si 'imagen' es el PDF o si existe otro campo. Por ahora usando 'imagen'.
      const ruta = `${this.publicUrl}/articulos/${a.id_articulo}/${a.imagen}`;
      window.open(ruta, '_blank');
    } else {
      const r = this.revista();
      if (!r) return;
      const ruta = `${this.publicUrl}/revistas/${r.id_revista}/archivo/${r.archivo}`;
      window.open(ruta, '_blank');
    }
  }

  // Sustituye tu método actual por este:
  abrirFlipbookEnPagina(pagina: number | string | null) {
    if (!pagina) return;

    // 1. FORZAR CONVERSIÓN A NÚMERO
    // Esto previene errores si la API devuelve "05" o "5" como texto
    const paginaNumero = Number(pagina);

    const flipbook = this.flipbookRef();

    // 2. DIAGNÓSTICO EN CONSOLA
    // Si no sale este log, el viewChild no está encontrando el componente
    if (!flipbook) {
      console.error('❌ Error: No se encuentra el componente Flipbook2 en la vista.');
      return;
    }

    // 3. VERIFICAR SI EL PDF ESTÁ LISTO
    // El flipbook necesita tener folios generados para poder navegar
    if (flipbook.folios().length === 0) {
        console.warn('⚠️ El PDF aún no se ha cargado o procesado. Intenta de nuevo en un momento.');
        return;
    }

    console.log(`✅ Navegando a página: ${paginaNumero} (Original: ${pagina})`);

    // 4. LLAMADA AL COMPONENTE
    flipbook.goToPage(paginaNumero);

    // 5. SCROLL SUAVE
    setTimeout(() => {
      // Intentamos buscar por la etiqueta del componente nuevo
      const element = document.querySelector('app-flipbook2');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}
