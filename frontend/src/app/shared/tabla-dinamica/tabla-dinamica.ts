// nuevo/frontend/src/app/shared/tabla-dinamica/tabla-dinamica.ts
import { Component, input, OnInit, OnChanges, SimpleChanges, computed, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { Observable } from 'rxjs';

// Importar TablaGenerica y su interfaz
import { TablaGenerica, ColumnConfig } from '../../admin/shared/tabla-generica/tabla-generica';

import { PaginatorModule, PaginatorState } from 'primeng/paginator';
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
  imports: [CommonModule, FormsModule, TablaGenerica, PaginatorModule],
  templateUrl: './tabla-dinamica.html',
  styleUrl: './tabla-dinamica.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablaDinamica implements OnInit, OnChanges {
  // Usar input() function en lugar de @Input
  strategy = input.required<TableStrategy>();

  // Usar signals para el estado
  viewMode = signal<'grid' | 'list'>('grid');
  columns = signal<TableColumn[]>([]);
  filtersConfig = signal<FilterConfig[]>([]);
  data = signal<any[]>([]);
  loading = signal(false);
  totalResultados = signal(0);
  totalPaginas = signal(0);
  paginaActual = signal(1);
  limite = signal(10);
  searchTerm = signal('');
  ordenActual = signal('');

  searchSubject = new Subject<string>();
  Math = Math;

  // 👇 Computed signals para tabla-generica
  tableGenericaColumns = computed<ColumnConfig[]>(() => {
    const strat = this.strategy();
    if (strat?.getTableGenericaColumns) {
      return strat.getTableGenericaColumns();
    }
    return [];
  });

  tableGenericaService = computed(() => {
    const strat = this.strategy();
    if (strat?.getDataService) {
      return strat.getDataService();
    }
    return null;
  });

  constructor() {
    this.searchSubject.pipe(debounceTime(500)).subscribe((term) => {
      this.searchTerm.set(term);
      this.paginaActual.set(1);
      this.cargarDatos();
    });

    // Effect para reaccionar a cambios en la estrategia
    effect(() => {
      const strat = this.strategy();
      if (strat) {
        this.inicializarTabla();
      }
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
    const strat = this.strategy();
    if (!strat) return;

    this.columns.set(strat.getColumns());

    this.loading.set(true);
    strat.initFilters().subscribe({
      next: (configs) => {
        this.filtersConfig.set(configs);
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  cargarDatos() {
    const strat = this.strategy();
    if (!strat) return;

    this.loading.set(true);
    const activeFilters: any = {};

    this.filtersConfig().forEach((f) => {
      if (f.type === 'checkbox' && Array.isArray(f.valorActual) && f.valorActual.length > 0) {
        activeFilters[f.key] = f.valorActual.join(',');
      } else if (f.type === 'text' && f.valorActual) {
        activeFilters[f.key] = f.valorActual;
      }
    });

    const params: TableParams = {
      page: this.paginaActual(),
      limit: this.limite(),
      search: this.searchTerm(),
      sort: this.ordenActual(),
      filters: activeFilters,
    };

    strat.getData(params).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalResultados.set(res.total);
        this.totalPaginas.set(Math.ceil(res.total / this.limite()));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // --- MÉTODOS UI ---

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  ordenar(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.ordenActual.set(select.value);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  toggleFilterGroup(f: FilterConfig) {
    const filters = this.filtersConfig();
    const index = filters.indexOf(f);
    if (index > -1) {
      const updated = [...filters];
      updated[index] = { ...f, expandido: !f.expandido };
      this.filtersConfig.set(updated);
    }
  }

  toggleCheckbox(f: FilterConfig, val: any) {
    const filters = this.filtersConfig();
    const index = filters.indexOf(f);
    if (index > -1) {
      const updated = [...filters];
      if (!Array.isArray(updated[index].valorActual)) {
        updated[index] = { ...updated[index], valorActual: [] };
      }
      const valores = [...updated[index].valorActual];
      const idx = valores.indexOf(val);

      if (idx > -1) {
        valores.splice(idx, 1);
      } else {
        valores.push(val);
      }

      updated[index] = { ...updated[index], valorActual: valores };
      this.filtersConfig.set(updated);
    }

    this.paginaActual.set(1);
    this.cargarDatos();
  }

  isChecked(f: FilterConfig, val: any): boolean {
    return Array.isArray(f.valorActual) && f.valorActual.includes(val);
  }

  getOpcionesVisibles(f: FilterConfig): FilterOption[] {
    if (!f.opciones) return [];
    if (!f.busquedaInterna) return f.opciones;
    return f.opciones.filter((o) =>
      o.label.toLowerCase().includes(f.busquedaInterna!.toLowerCase())
    );
  }

  limpiarFiltros() {
    const filters = this.filtersConfig().map((f) => ({
      ...f,
      valorActual: f.type === 'checkbox' ? [] : '',
      busquedaInterna: '',
    }));

    this.filtersConfig.set(filters);
    this.searchTerm.set('');
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  onView(item: any) {
    const strat = this.strategy();
    if (strat?.onView) {
      strat.onView(item);
    } else {
      //console.log('Ver:', item);
    }
  }

  onPageChange(event: PaginatorState) {
    this.paginaActual.set(event.first! / event.rows! + 1);
    this.limite.set(event.rows!);
    this.cargarDatos();
  }

  // Métodos auxiliares para el template
  updateFilterBusqueda(f: FilterConfig, value: string) {
    const filters = this.filtersConfig();
    const index = filters.indexOf(f);
    if (index > -1) {
      const updated = [...filters];
      updated[index] = { ...updated[index], busquedaInterna: value };
      this.filtersConfig.set(updated);
    }
  }

  updateFilterValor(f: FilterConfig, value: any) {
    const filters = this.filtersConfig();
    const index = filters.indexOf(f);
    if (index > -1) {
      const updated = [...filters];
      updated[index] = { ...updated[index], valorActual: value };
      this.filtersConfig.set(updated);
    }
    this.paginaActual.set(1);
    this.cargarDatos();
  }
}
