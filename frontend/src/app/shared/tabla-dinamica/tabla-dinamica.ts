// nuevo/frontend/src/app/shared/tabla-dinamica/tabla-dinamica.ts
// nuevo/frontend/src/app/shared/tabla-dinamica/tabla-dinamica.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { Observable } from 'rxjs';

// Importar TablaGenerica y su interfaz
import { TablaGenerica, ColumnConfig } from '../../admin/shared/tabla-generica/tabla-generica';

// --- CONFIGURACIÓN VISUAL ---

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'badge' | 'currency' | 'link';
  role?: 'title' | 'subtitle' | 'body' | 'footer';
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'checkbox' | 'text' | 'date';
  expandido?: boolean;
  opciones?: FilterOption[];
  valorActual?: any;
  busquedaInterna?: string;
}

export interface FilterOption {
  label: string;
  value: any;
}

// --- CONFIGURACIÓN DE DATOS ---

export interface TableParams {
  page: number;
  limit: number;
  search: string;
  sort: string;
  filters: { [key: string]: any };
}

export interface TableData {
  data: any[];
  total: number;
}

// --- EL CONTRATO DE ESTRATEGIA ---
export interface TableStrategy {
  getColumns(): TableColumn[];
  initFilters(): Observable<FilterConfig[]>;
  getData(params: TableParams): Observable<TableData>;
  
  // 👇 Métodos opcionales para tabla-generica
  getTableGenericaColumns?(): ColumnConfig[];
  getDataService?(): any;
  
  // 👇 NUEVO: Métodos opcionales para manejar acciones
  onView?(item: any): void;
  onEdit?(item: any): void;
  onDelete?(item: any): void;
  onAdd?(): void;
}

@Component({
  selector: 'app-tabla-dinamica',
  standalone: true,
  imports: [CommonModule, FormsModule, TablaGenerica],
  templateUrl: './tabla-dinamica.html',
  styleUrl: './tabla-dinamica.css',
})
export class TablaDinamica implements OnInit, OnChanges {
  @Input() strategy!: TableStrategy;

  viewMode: 'grid' | 'list' = 'grid';

  columns: TableColumn[] = [];
  filtersConfig: FilterConfig[] = [];
  data: any[] = [];

  loading = false;
  totalResultados = 0;
  totalPaginas = 0;
  paginaActual = 1;
  limite = 10;
  searchTerm = '';
  searchSubject = new Subject<string>();

  ordenActual = '';
  Math = Math;

  // 👇 Computed signals para tabla-generica
  tableGenericaColumns = computed<ColumnConfig[]>(() => {
    if (this.strategy?.getTableGenericaColumns) {
      return this.strategy.getTableGenericaColumns();
    }
    return [];
  });

  tableGenericaService = computed(() => {
    if (this.strategy?.getDataService) {
      return this.strategy.getDataService();
    }
    return null;
  });

  constructor() {
    this.searchSubject.pipe(debounceTime(500)).subscribe((term) => {
      this.searchTerm = term;
      this.paginaActual = 1;
      this.cargarDatos();
    });
  }

  ngOnInit() {
    this.inicializarTabla();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['strategy'] && !changes['strategy'].firstChange) {
      this.inicializarTabla();
    }
  }

  inicializarTabla() {
    if (!this.strategy) return;

    this.columns = this.strategy.getColumns();

    this.loading = true;
    this.strategy.initFilters().subscribe({
      next: (configs) => {
        this.filtersConfig = configs;
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  cargarDatos() {
    if (!this.strategy) return;

    this.loading = true;
    const activeFilters: any = {};

    this.filtersConfig.forEach((f) => {
      if (f.type === 'checkbox' && Array.isArray(f.valorActual) && f.valorActual.length > 0) {
        activeFilters[f.key] = f.valorActual.join(',');
      } else if (f.type === 'text' && f.valorActual) {
        activeFilters[f.key] = f.valorActual;
      }
    });

    const params: TableParams = {
      page: this.paginaActual,
      limit: this.limite,
      search: this.searchTerm,
      sort: this.ordenActual,
      filters: activeFilters,
    };

    this.strategy.getData(params).subscribe({
      next: (res) => {
        this.data = res.data;
        this.totalResultados = res.total;
        this.totalPaginas = Math.ceil(this.totalResultados / this.limite);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  // --- MÉTODOS UI ---

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  ordenar(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.ordenActual = select.value;
    this.paginaActual = 1;
    this.cargarDatos();
  }

  cambiarLimite(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.limite = +select.value;
    this.paginaActual = 1;
    this.cargarDatos();
  }

  toggleFilterGroup(f: FilterConfig) {
    f.expandido = !f.expandido;
  }

  toggleCheckbox(f: FilterConfig, val: any) {
    if (!Array.isArray(f.valorActual)) f.valorActual = [];
    const idx = f.valorActual.indexOf(val);
    idx > -1 ? f.valorActual.splice(idx, 1) : f.valorActual.push(val);
    this.paginaActual = 1;
    this.cargarDatos();
  }

  isChecked(f: FilterConfig, val: any) {
    return Array.isArray(f.valorActual) && f.valorActual.includes(val);
  }

  getOpcionesVisibles(f: FilterConfig) {
    if (!f.opciones) return [];
    if (!f.busquedaInterna) return f.opciones;
    return f.opciones.filter((o) =>
      o.label.toLowerCase().includes(f.busquedaInterna!.toLowerCase())
    );
  }

  limpiarFiltros() {
    this.filtersConfig.forEach((f) => {
      f.valorActual = f.type === 'checkbox' ? [] : '';
      f.busquedaInterna = '';
    });
    this.searchTerm = '';
    this.paginaActual = 1;
    this.cargarDatos();
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
      this.cargarDatos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  obtenerPaginasVisibles(): (number | string)[] {
    const paginas: (number | string)[] = [];
    const total = this.totalPaginas;
    const current = this.paginaActual;

    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    paginas.push(1);
    if (current > 3) paginas.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) paginas.push(i);

    if (current < total - 2) paginas.push('...');
    paginas.push(total);

    return paginas;
  }

  onSearch(val: string) {
    this.searchSubject.next(val);
  }

  // 👇 NUEVOS MÉTODOS: Delegan a la estrategia
  onView(item: any) {
    if (this.strategy?.onView) {
      this.strategy.onView(item);
    } else {
      console.log('Ver:', item);
    }
  }
}