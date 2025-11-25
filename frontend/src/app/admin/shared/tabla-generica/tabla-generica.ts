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
  WritableSignal,
  effect,
  untracked,
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
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlatformService } from '../../../core/services/platform.service';
import { FormsModule } from '@angular/forms';

export interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'date' | 'select' | 'multiselect' | 'numeric';
  options?: { label: string; value: any }[];
  backendField?: string; // Nombre del campo en BD para filtrado/ordenamiento
  // 👇 NUEVO: para cargar opciones desde el backend
  loadOptionsFromBackend?: boolean; // Si es true, carga opciones de valores-unicos
  optionsField?: string; // Nombre del campo en la respuesta del backend (por defecto: field)
  template?: (row: any) => string; //para html crudo
  width?: string;
  tooltip?: boolean; // 👈 NUEVO: permite activar/desactivar el tooltip
  // 👇 NUEVAS PROPIEDADES PARA FORMATEO
  dateFormat?: 'short' | 'medium' | 'long' | 'full' | 'custom'; // Formato de fecha
  customDateFormat?: Intl.DateTimeFormatOptions; // Formato personalizado
  pipe?: 'date' | 'currency' | 'number'; // Tipo de pipe a aplicar
  // 👇 NUEVO: soporte visual para PrimeNG Tag / Badge
  renderAs?: 'tag' | 'badge' | 'custom';
  getLabel?: (row: any, field: string) => string;
  getSeverity?: (
    row: any,
    field: string
  ) => 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;
  customTemplate?: (row: any) => any; // por si quieres algo totalmente personalizado
}

// Ejemplo de configuración de columnas con diferentes formatos de fecha

/* columns: ColumnConfig[] = [
{
      field: 'nombre_municipio',
      header: 'Municipio',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      // ✅ agrega opciones aquí
      options: this.municipiosOptions(),
      optionsField: 'id_municipio', 
    },
    {
      field: 'tipo_archivo',
      header: 'Tipo',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      // ✅ agrega opciones aquí
      loadOptionsFromBackend: true, // 👈 Carga opciones desde backend
      optionsField: 'tipo_archivo',
    },
    {
      field: 'categoria_archivo',
      header: 'Categoria',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      // ✅ agrega opciones aquí
      loadOptionsFromBackend: true, // 👈 Carga opciones desde backend
      optionsField: 'categoria_archivo',
    },
  {
    field: 'fecha_publicacion',
    header: 'Fecha de Publicación',
    sortable: true,
    filterable: true,
    filterType: 'date',
    width: '180px',
    dateFormat: 'long' // 5 de noviembre de 2025
  },
  {
    field: 'fecha_registro',
    header: 'Registro',
    sortable: true,
    filterable: true,
    filterType: 'date',
    width: '120px',
    dateFormat: 'short' // 05/11/2025
  },
  {
    field: 'fecha_evento',
    header: 'Evento',
    sortable: true,
    filterType: 'date',
    width: '150px',
    dateFormat: 'custom',
    customDateFormat: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    } // 05/11/2025, 14:30
  }
]; */

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
    BadgeModule,
    FormsModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabla-generica.html',
  styleUrl: './tabla-generica.css',
})
export class TablaGenerica {
  protected platform = inject(PlatformService);
  private messageService = inject(MessageService);

  // Inputs
  dataService = input<any>(); // debe tener un método getFiltrados(params) []
  columns = input<ColumnConfig[]>([]); // con esto especificas las columnas que necesitas y sus propiedades []
  title = input<string>('Tabla General'); //este es el titulo de la tabla []
  entityName = input<string>('registro'); //los objetos que maneja la tabla []
  refreshSignal = input<WritableSignal<number> | null>(null); // señal para recargar la tabla []
  // Inputs de control visual
  showViewButton = input<boolean>(true); // mostrar u ocultar botón ver []
  showEditButton = input<boolean>(true); // mostrar u ocultar botón editar []
  showDeleteButton = input<boolean>(true); // mostrar u ocultar botón eliminar []
  showSelection = input<boolean>(true); // mostrar u ocultar selección de filas []

  // Outputs
  add = output<void>(); // evento para agregar elementos a la tabla ()
  edit = output<any>(); // evento para editar un elemento ()
  remove = output<any>(); // evento para eliminar elementos ()
  view = output<any>(); // evento para ver detalles de un elemento ()

  // Estado reactivo
  readonly data = signal<any[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(false);
  readonly selectedItems = signal<any[]>([]);
  readonly rows = signal(10);

  // 👇 NUEVO: Signal para valores únicos del backend
  readonly backendOptions = signal<Record<string, any[]>>({});
  readonly loadingOptions = signal(false);

  // 👇 NUEVO: Signal para columnas con opciones procesadas
  readonly columnsWithOptions = signal<ColumnConfig[]>([]);

  @ViewChild('dt') dt!: Table;

  readonly globalFilterFields = computed(
    () =>
      this.columns()
        .filter((c) => c.filterable) // Solo columnas filtrables
        .map((c) => c.field) // Tomamos el nombre del campo
  );

  constructor() {
    // Effect para cargar valores únicos del backend
    effect(() => {
      //console.log("efect 1")
      const service = this.dataService();
      const cols = this.columns();

      if (!service || !cols.length) return;

      // Verificar si alguna columna necesita cargar opciones del backend
      const needsBackendOptions = cols.some(
        (col) =>
          col.loadOptionsFromBackend &&
          col.filterType === 'multiselect' &&
          (!col.options || col.options.length === 0)
      );

      if (needsBackendOptions && service.getValoresUnicos) {
        untracked(() => {
          this.loadBackendOptions();
        });
      }
    });

    // Effect para actualizar columnas cuando cambian o llegan opciones del backend
    effect(() => {
      //console.log("efect 2")
      const cols = this.columns();
      const backendOpts = this.backendOptions();

      untracked(() => {
        this.updateColumnsWithOptions(cols, backendOpts);
      });
    });
    // effect que escucha el valor de la señal del padre
    effect(() => {
      //console.log("efect 3")
      const sig = this.refreshSignal(); // obtengo la referencia a la signal pasada por input
      if (!sig) return; // si no fue provista, salir

      // leo el valor de la signal fuera de untracked => registra la dependencia
      const current = sig(); // <- cuando el padre haga .update(), esto dispara el effect

      // ahora hago la recarga dentro de untracked para evitar que los cambios internos (data/loading)
      // vuelvan a disparar este mismo effect.
      untracked(() => {
        console.log('🔄 Recargando tabla por refreshSignal, valor:', current);
        // puedes usar rows() para tamaño de página si lo deseas:
        this.loadData({ first: 0, rows: this.rows() } as TableLazyLoadEvent);
      });
    });
  }

  // 👇 NUEVO: Método para cargar valores únicos del backend
  private loadBackendOptions() {
    const service = this.dataService();

    if (!service || !service.getValoresUnicos) {
      console.warn('⚠️ El servicio no tiene el método getValoresUnicos()');
      return;
    }

    this.loadingOptions.set(true);

    service.getValoresUnicos().subscribe({
      next: (resp: any) => {
        if (resp.success && resp.data) {
          console.log('✅ Valores únicos cargados del backend:', resp.data);
          this.backendOptions.set(resp.data);
        }
        this.loadingOptions.set(false);
      },
      error: (err: any) => {
        console.error('❌ Error cargando valores únicos:', err);
        this.loadingOptions.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar las opciones de filtros',
        });
      },
    });
  }

  // 👇 NUEVO: Actualizar columnas con opciones del backend
  private updateColumnsWithOptions(columns: ColumnConfig[], backendOptions: Record<string, any[]>) {
    const updatedColumns = columns.map((col) => {
      // Si ya tiene opciones definidas, no hacer nada
      if (col.options && col.options.length > 0) {
        return col;
      }

      // Si debe cargar opciones del backend
      if (col.loadOptionsFromBackend && col.filterType === 'multiselect') {
        const fieldName = col.optionsField || col.field;
        const values = backendOptions[fieldName];

        if (values && Array.isArray(values) && values.length > 0) {
          return {
            ...col,
            options: values.map((value) => ({
              label: value.toString(),
              value: value,
            })),
          };
        }
      }

      return col;
    });

    this.columnsWithOptions.set(updatedColumns);
  }

  // Carga inicial
  loadData(event: TableLazyLoadEvent) {
    this.loading.set(true);
    const params = this.buildQueryParams(event);

    this.dataService()
      ?.getFiltrados(params)
      .subscribe({
        next: (resp: any) => {
          this.data.set(resp.data);
          //console.log(this.data());
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
    //console.log('datos ', this.data());
    //console.log('columnas ', this.columns());
  }

  private buildQueryParams(event: TableLazyLoadEvent) {
    const params: any = {
      limite: event.rows ?? 10,
      pagina: Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1,
    };

    // 🔍 Búsqueda global
    if (event.globalFilter) {
      params.busqueda = event.globalFilter;
    }

    // 🔀 Ordenamiento
    if (event.sortField) {
      // 👇 Buscar la columna para ver si tiene backendField
      const column = this.columnsWithOptions().find((c) => c.field === event.sortField);
      const fieldToSort = column?.backendField || event.sortField;

      params.sortField = fieldToSort;
      params.sortOrder = event.sortOrder;
    }

    // 🎯 Filtros por columna
    if (event.filters) {
      for (const [field, filter] of Object.entries(event.filters)) {
        const value = this.getFilterValue(filter);
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue;

        const matchMode = this.getMatchMode(filter);

        // 👇 Buscar la columna para ver si tiene backendField
        const column = this.columnsWithOptions().find((c) => c.field === field);
        const fieldToFilter = column?.backendField || field;

        // Guardamos valor y matchMode en los params usando el campo correcto
        params[fieldToFilter] = value;
        params[`${fieldToFilter}_matchMode`] = matchMode;
      }
    }

    return params;
  }

  private getFilterValue(filter: any): any {
    if (!filter) return null;

    // Si es un array de FilterMetadata (varios filtros)
    if (Array.isArray(filter)) {
      return filter[0]?.value ?? null;
    }

    // Si es un solo FilterMetadata
    if (typeof filter === 'object' && 'value' in filter) {
      return filter.value;
    }

    return null;
  }

  private getMatchMode(filter: any): string {
    if (!filter) return 'contains';

    if (Array.isArray(filter)) {
      return filter[0]?.matchMode ?? 'contains';
    }

    if (typeof filter === 'object' && 'matchMode' in filter) {
      return filter.matchMode ?? 'contains';
    }

    return 'contains';
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

  getTooltipValue(row: any, col: ColumnConfig): string {
    // Si hay template (como imágenes), no mostrar tooltip
    if (col.template) {
      return '';
    }

    // Si es una fecha, formatear
    if (col.filterType === 'date' || col.dateFormat) {
      return this.formatDate(row[col.field], col.dateFormat || 'medium', col.customDateFormat);
    }

    // Valor por defecto
    const value = row[col.field];
    return value != null && value !== '' ? value.toString() : '';
  }

  getCellValue(row: any, col: ColumnConfig): string {
    // Si hay un template personalizado, usarlo
    if (col.template) {
      return col.template(row);
    }

    const value = row[col.field];

    // Si no hay valor, retornar vacío
    if (value == null || value === '') return '';

    // Si es una columna de fecha y tiene formato especificado
    if (col.filterType === 'date' || col.dateFormat) {
      return this.formatDate(value, col.dateFormat || 'medium', col.customDateFormat);
    }

    // Valor por defecto
    return value.toString();
  }

  private formatDate(
    value: any,
    format: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'medium',
    customFormat?: Intl.DateTimeFormatOptions
  ): string {
    if (!value) return '';

    let date = new Date(value);

    // ⚙️ Ajuste para compensar zona horaria (mantiene la hora "como está en BD")
    date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

    // Si no es una fecha válida, devolver texto original
    if (isNaN(date.getTime())) return value.toString();

    const locale = 'es-MX';

    // Formatos predefinidos
    const formats: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // 👈 muestra AM/PM
      },
      full: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      },
    };

    const options = format === 'custom' && customFormat ? customFormat : formats[format];

    return date.toLocaleString(locale, options); // 👈 usamos toLocaleString, no toLocaleDateString
  }
}
