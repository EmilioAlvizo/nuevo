// nuevo/frontend/src/app/admin/shared/tabla-generica/tabla-generica.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

export interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'date' | 'select' | 'multiselect';
  options?: { label: string; value: any }[];
  template?: (row: any) => string;
  width?: string;
  tooltip?: boolean; // 👈 NUEVO: permite activar/desactivar el tooltip
}

@Component({
  selector: 'app-tabla-generica',
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ToolbarModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabla-generica.html',
  styleUrl: './tabla-generica.css',
})
export class TablaGenerica {
  private messageService = inject(MessageService);

  // Inputs
  dataService = input<any>(); // debe tener un método getFiltrados(params)
  columns = input<ColumnConfig[]>([]);
  title = input<string>('Tabla General');
  entityName = input<string>('registro');
  selectable = input<boolean>(true);

  // Outputs
  formulario = output<void>();
  edit = output<any>();
  remove = output<any>();
  view = output<any>();

  // Estado reactivo
  readonly data = signal<any[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(false);
  readonly selectedItems = signal<any[]>([]);
  readonly rows = signal(10);

  @ViewChild('dt') dt!: Table;

  // Carga inicial
  loadData(event: TableLazyLoadEvent) {
    this.loading.set(true);
    const params = this.buildQueryParams(event);

    this.dataService()
      ?.getFiltrados(params)
      .subscribe({
        next: (resp: any) => {
          this.data.set(resp.data);
          this.totalRecords.set(resp.total || 0);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error(err);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudieron cargar los ${this.entityName()}s.`,
          });
        },
      });
    console.log('datos ', this.data());
    console.log('columnas ', this.columns());
  }

  private buildQueryParams(event: TableLazyLoadEvent) {
    const params: any = {
      limite: event.rows ?? 10,
      pagina: Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1,
    };
    if (event.globalFilter) params.busqueda = event.globalFilter;
    if (event.sortField) {
      params.sortField = event.sortField;
      params.sortOrder = event.sortOrder;
    }
    // Filtros específicos
    for (const [field, meta] of Object.entries(event.filters ?? {})) {
      const value = (meta as any)?.value;
      if (value != null && value !== '') params[field] = value;
    }
    return params;
  }

  clearFilters() {
    this.dt.clear();
  }

  // Métodos relacionados con selección múltiple
  removeSelected() {
    const items = this.selectedItems();
    if (!items.length) return;

    this.remove.emit(items);
    this.selectedItems.set([]);
  }

  hasSelectedItems(): boolean {
    return this.selectedItems().length > 0;
  }
}
