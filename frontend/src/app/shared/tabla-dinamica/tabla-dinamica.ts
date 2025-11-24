// nuevo/
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';

import { PlatformService } from '../../core/services/platform.service';

export interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'numeric' | 'multiselect';
  options?: { label: string; value: any }[];
  placeholder?: string;
  collapsible?: boolean;
  loadOptionsFromBackend?: boolean;
  optionsField?: string;
}

export interface ColumnConfig {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  template?: (row: any) => string;
  badge?: boolean;
  badgeColor?: (row: any, field: string) => string;
  dateFormat?: boolean;
}

export interface TableResponse<T> {
  data: T[];
  total: number;
  totalPaginas: number;
  pagina?: number;
}

@Component({
  selector: 'app-tabla-dinamica',
  imports: [ButtonModule, ToolbarModule, TableModule, MultiSelectModule, TagModule, BadgeModule],
  templateUrl: './tabla-dinamica.html',
  styleUrl: './tabla-dinamica.css',
})
export class TablaDinamica<T> {
  platformService = inject(PlatformService);
  @Input() service: any; // El servicio que proporciona los datos
  @Input() columns: ColumnConfig[] = [];
  @Input() filters: FilterConfig[] = [];
  @Input() title: string = 'Tabla de Resultados';
  @Input() entityName: string = 'registro';
  @Input() pageSize: number = 10;
  @Input() showViewMode: boolean = true;

  @Output() rowSelected = new EventEmitter<T>();
  @Output() rowDeleted = new EventEmitter<T>();
  @Output() rowEdited = new EventEmitter<T>();

  // Estado
  rows: T[] = [];
  totalRecords: number = 0;
  totalPages: number = 0;
  currentPage: number = 1;
  loading: boolean = false;
  viewMode: 'list' | 'grid' = 'list';

  // Filtros
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  selectedFilters: Map<string, any> = new Map();
  filterOptions: Map<string, any[]> = new Map();
  loadingOptions: boolean = false;

  // Ordenamiento
  sortField: string = '';
  sortOrder: string = '';

  // Grupos expandibles
  filterGroups: Map<string, boolean> = new Map();
  Math = Math;

  constructor() {
    this.searchSubject.pipe(debounceTime(500)).subscribe((term) => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadData();
    });
  }

  ngOnInit(): void {
    this.initializeFilterGroups();
    this.loadBackendOptions();
    this.loadData();
  }

  private initializeFilterGroups(): void {
    this.filters.forEach((f) => {
      if (f.collapsible !== false) {
        this.filterGroups.set(f.field, false);
      }
    });
    // Búsqueda siempre expandida
    this.filterGroups.set('search', true);
  }

  private loadBackendOptions(): void {
    const filtersNeedingBackend = this.filters.filter(
      (f) => f.loadOptionsFromBackend && (!f.options || f.options.length === 0)
    );

    if (filtersNeedingBackend.length === 0 || !this.service?.getValoresUnicos) {
      return;
    }

    this.loadingOptions = true;

    this.service.getValoresUnicos().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          filtersNeedingBackend.forEach((filter) => {
            const fieldName = filter.optionsField || filter.field;
            const values = response.data[fieldName];
            if (values && Array.isArray(values)) {
              this.filterOptions.set(
                filter.field,
                values.map((v) => ({ label: v.toString(), value: v }))
              );
            }
          });
        }
        this.loadingOptions = false;
      },
      error: (err: any) => {
        console.error('Error loading backend options:', err);
        this.loadingOptions = false;
      },
    });
  }

  loadData(): void {
    if (!this.service) return;

    this.loading = true;
    const params = this.buildParams();

    this.service.getFiltrados(params).subscribe({
      next: (response: TableResponse<T>) => {
        this.rows = response.data;
        this.totalRecords = response.total || 0;
        this.totalPages = response.totalPaginas || 0;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading data:', err);
        this.loading = false;
      },
    });
  }

  private buildParams(): any {
    const params: any = {
      limite: this.pageSize,
      pagina: this.currentPage,
    };

    if (this.searchTerm) {
      params.busqueda = this.searchTerm;
    }

    // Agregar filtros personalizados
    this.selectedFilters.forEach((value, key) => {
      if (value !== null && value !== undefined && value !== '') {
        // Si es un array, convertir a string separado por comas
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params[key] = value.join(',');
          }
        } else {
          params[key] = value;
        }
      }
    });

    // Ordenamiento
    if (this.sortField) {
      params.ordenar = this.sortField;
      if (this.sortOrder) {
        params.sortOrder = this.sortOrder;
      }
    }

    return params;
  }

  onSearch(term: string): void {
    this.searchSubject.next(term.toLowerCase());
  }

  onFilterChange(filterField: string, value: any): void {
    this.selectedFilters.set(filterField, value);
    this.currentPage = 1;
    this.loadData();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.currentPage = 1;
    this.loadData();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.loadData();
    }
  }

  changePageSize(size: string | number): void {
    const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize = sizeNum;
    this.currentPage = 1;
    this.loadData();
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  getCellValue(row: T, col: ColumnConfig): string {
    if (col.template) {
      return col.template(row);
    }

    const value = (row as any)[col.field];
    if (col.dateFormat && value) {
      return new Date(value).toLocaleDateString('es-MX');
    }
    return value != null ? value.toString() : '';
  }

  toggleFilterGroup(field: string): void {
    this.filterGroups.set(field, !this.filterGroups.get(field));
  }

  getFilterGroup(field: string): boolean {
    return this.filterGroups.get(field) ?? false;
  }

  getFilterOptions(field: string): any[] {
    return this.filterOptions.get(field) ?? [];
  }

  onMultiselectChange(filterField: string, event: any): void {
    const select = event.target as HTMLSelectElement;
    const selectedValues = Array.from(select.selectedOptions, (o: any) => o.value);
    this.onFilterChange(filterField, selectedValues);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedFilters.clear();
    this.sortField = '';
    this.sortOrder = '';
    this.currentPage = 1;
    this.loadData();
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  onRowAction(action: 'view' | 'edit' | 'delete', row: T): void {
    switch (action) {
      case 'view':
        this.rowSelected.emit(row);
        break;
      case 'edit':
        this.rowEdited.emit(row);
        break;
      case 'delete':
        this.rowDeleted.emit(row);
        break;
    }
  }
}
