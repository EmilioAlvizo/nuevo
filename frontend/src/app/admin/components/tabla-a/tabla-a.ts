// nuevo/frontend/src/app/admin/components/tabla-a/tabla-a.ts
import {
  Component,
  ViewChild,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormGroup, FormBuilder } from '@angular/forms';
import {
  ApiArchivos_municipio,
  Archivos_municipio,
} from '../../../core/services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { NuevoArchivoForm } from '../nuevo-archivo-form/nuevo-archivo-form';


import { PlatformService } from '../../../core/services/platform.service';


// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { FilterMetadata, SortEvent } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { Table } from 'primeng/table';

interface LazyLoadParams {
  municipios?: number[];
  busqueda?: string;
  categoria?: string;
  palabra_clave?: string;
  tipo?: string;
  ordenar?: string;
  limite?: number;
  pagina?: number;
}

@Component({
  selector: 'app-tabla-a',
  standalone: true,
  imports: [
    MultiSelectModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToolbarModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    SelectModule,
    DialogModule,
    FileUploadModule,
    MessageModule,
    NuevoArchivoForm,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabla-a.html',
  styleUrl: './tabla-a.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaA {
  protected platform = inject(PlatformService);
  // 🧩 Servicios inyectados (sin constructor)
  private apiArchivos_municipio = inject(ApiArchivos_municipio);
  private apiMunicipio = inject(ApiMunicipio);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // 📦 Estado reactivo con signals
  readonly archivos_municipio = signal<Archivos_municipio[]>([]);
  readonly selectedArchivos = signal<Archivos_municipio[]>([]);
  readonly municipios = signal<Municipio[]>([]);
  readonly loading = signal(true);
  totalRecords = signal<number>(0);

  // ⚙️ Estado UI
  readonly nuevoArchivoDialog = signal(false);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly submitted = signal(false);

  // Paginación
  first = signal<number>(0);
  rows = signal<number>(10);

  // 🆕 Estado para filtros activos
  readonly filtrosActivos = signal<any>({});
  readonly ordenActual = signal<{ field: string; order: number } | null>(null);

  // 🆕 propiedades para el sort removible:
  isSorted: boolean | null = null;
  lastSortField: string | null = null;

  // 🧾 Nuevo archivo en creación
  readonly nuevoArchivo = signal<Partial<Archivos_municipio>>({
    estatus_archivo: 'A',
    tipo_archivo: '',
    categoria_archivo: '',
    palabras_clave: '',
    subcategoria_archivo: '',
    archivo: '',
  });

  // 📑 Listas estáticas
  readonly tiposArchivo = ['Resultados', 'Informe', 'Reporte', 'Documento', 'Otro'];
  readonly categorias = ['Población', 'Económica', 'Social', 'Ambiental', 'Otro'];
  readonly estatusOptions = [
    { label: 'Activo', value: 'A' as const },
    { label: 'Inactivo', value: 'I' as const },
  ];

  @ViewChild('fileUploader') fileUploader?: any;
  @ViewChild('dt') table!: Table;
  @ViewChild(NuevoArchivoForm) archivoForm?: NuevoArchivoForm;

  // Dialog - ✅ Cambiar a signal writable
  showDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  archivoToEdit = signal<Archivos_municipio | null>(null);

  // Computed
  hasSelectedArchivos = computed(() => this.selectedArchivos().length > 0);

  // 🧠 Computed: opciones de municipios
  readonly municipiosOptions = computed(() =>
    this.municipios().map((m) => ({
      label: m.nombre,
      value: m.id_municipio,
    }))
  );

  // 🚀 Efectos reactivos para cargar datos
  constructor() {
    effect(() => this.cargarArchivos());
    effect(() => this.cargarMunicipios());
  }

  private cargarArchivos(): void {
    this.loading.set(true);
    this.apiArchivos_municipio.getMessage().subscribe({
      next: (res) => {
        this.archivos_municipio.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los archivos',
        });
        console.error(err);
      },
    });
  }

  private cargarMunicipios(): void {
    // Solo carga si aún no hay municipios
    if (this.municipios().length > 0) return;
    this.apiMunicipio.getMessage().subscribe({
      next: (res) => this.municipios.set(res.data),
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los municipios',
        });
      },
    });
  }

  // 🔥 NUEVO: Método principal para cargar archivos con lazy loading
  loadArchivos(event: TableLazyLoadEvent): void {
    this.loading.set(true);

    //console.log('📥 Evento completo de la tabla:', event);

    // Construir parámetros de la consulta
    const params: any = {
      limite: event.rows || 10,
      pagina: Math.floor((event.first || 0) / (event.rows || 10)) + 1,
    };

    // 🔍 Agregar búsqueda global
    if (event.globalFilter) {
      params.busqueda = event.globalFilter as string;
    }

    // 🎯 Procesar filtros de columna
    if (event.filters) {
      //console.log('🔍 Filtros recibidos:', event.filters);

      // Filtro por nombre de archivo
      const nombreFiltro = this.getFilterValue(event.filters['nombre_archivo']);
      if (nombreFiltro) {
        params.nombre_archivo = nombreFiltro;
        params.nombre_archivo_matchMode = this.getMatchMode(event.filters['nombre_archivo']);
      }

      // Filtro por municipio (multiselect)
      const municipioFiltro = this.getFilterValue(event.filters['nombre_municipio']);
      if (municipioFiltro && Array.isArray(municipioFiltro) && municipioFiltro.length > 0) {
        params.municipios = municipioFiltro;
      }

      // Filtro por tipo (multiselect)
      const tipoFiltro = this.getFilterValue(event.filters['tipo_archivo']);
      if (tipoFiltro && Array.isArray(tipoFiltro) && tipoFiltro.length > 0) {
        params.tipos = tipoFiltro;
      }

      // Filtro por categoría (multiselect)
      const categoriaFiltro = this.getFilterValue(event.filters['categoria_archivo']);
      if (categoriaFiltro && Array.isArray(categoriaFiltro) && categoriaFiltro.length > 0) {
        params.categorias = categoriaFiltro;
      }

      // Filtro por subcategoría
      const subcategoriaFiltro = this.getFilterValue(event.filters['subcategoria_archivo']);
      if (subcategoriaFiltro) {
        params.subcategoria = subcategoriaFiltro;
        params.subcategoria_matchMode = this.getMatchMode(event.filters['subcategoria_archivo']);
      }

      // Filtro por palabras clave
      const palabrasFiltro = this.getFilterValue(event.filters['palabras_clave']);
      if (palabrasFiltro) {
        params.palabras_clave = palabrasFiltro;
        params.palabras_clave_matchMode = this.getMatchMode(event.filters['palabras_clave']);
      }

      // Filtro por estatus (multiselect)
      const estatusFiltro = this.getFilterValue(event.filters['estatus_archivo']);
      if (estatusFiltro && Array.isArray(estatusFiltro) && estatusFiltro.length > 0) {
        params.estatus = estatusFiltro;
      }

      // Filtros por fecha
      const fechaArchivoFiltro = this.getFilterValue(event.filters['fecha_archivo']);
      if (fechaArchivoFiltro) {
        params.fecha_archivo = fechaArchivoFiltro;
        params.fecha_archivo_matchMode = this.getMatchMode(event.filters['fecha_archivo']);
      }

      const fechaModFiltro = this.getFilterValue(event.filters['fecha_modificacion']);
      if (fechaModFiltro) {
        params.fecha_modificacion = fechaModFiltro;
        params.fecha_modificacion_matchMode = this.getMatchMode(
          event.filters['fecha_modificacion']
        );
      }
    }

    // 🔀 IMPORTANTE: Agregar ordenamiento con sortField y sortOrder
    if (event.sortField && event.sortOrder) {
      params.sortField = event.sortField as string;
      params.sortOrder = event.sortOrder;
    }

    console.log('📤 Parámetros enviados al backend:', params);

    // 📡 Llamada al API
    this.apiArchivos_municipio.getArchivosFiltrados(params).subscribe({
      next: (response) => {
        //console.log('✅ Respuesta del backend:', response);
        this.archivos_municipio.set(response.data);
        this.totalRecords.set(response.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar archivos:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los archivos',
          life: 3000,
        });
        this.archivos_municipio.set([]);
        this.totalRecords.set(0);
      },
    });
  }

  // 🛠️ Utilidad para extraer el valor del filtro
  private getFilterValue(filter: any): any {
    if (!filter) return null;

    // Si es un array de FilterMetadata (cuando hay múltiples condiciones)
    if (Array.isArray(filter)) {
      return filter[0]?.value || null;
    }

    // Si es un objeto FilterMetadata
    if (filter && typeof filter === 'object' && 'value' in filter) {
      return filter.value;
    }

    return null;
  }

  // 🛠️ Utilidad para extraer el matchMode del filtro
  private getMatchMode(filter: any): string {
    if (!filter) return 'contains';

    if (Array.isArray(filter)) {
      return filter[0]?.matchMode || 'contains';
    }

    if (filter && typeof filter === 'object' && 'matchMode' in filter) {
      return filter.matchMode;
    }

    return 'contains';
  }

  // 🗂️ Dialog handlers
  hideDialog(): void {
    this.nuevoArchivoDialog.set(false);
    this.submitted.set(false);
    this.archivoSeleccionado.set(null);
    this.fileUploader?.clear();
  }

  openNew(): void {
    this.isEditMode.set(false);
    this.archivoToEdit.set(null);
    this.showDialog.set(true);
  }

  // 📥 Subida de archivos
  onArchivoSelect(event: { files: File[] }): void {
    const file = event.files?.[0];
    if (!file) return;

    this.archivoSeleccionado.set(file);
    const nuevo = { ...this.nuevoArchivo(), archivo: file.name };
    if (!nuevo.nombre_archivo) nuevo.nombre_archivo = file.name.split('.')[0];
    this.nuevoArchivo.set(nuevo);

    this.messageService.add({
      severity: 'info',
      summary: 'Archivo seleccionado',
      detail: file.name,
    });
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.messageService.add({
      severity: 'warn',
      summary: 'Archivo removido',
      detail: 'Debe seleccionar un archivo',
    });
  }

  guardarNuevoArchivo(): void {
    const nuevo = this.nuevoArchivo();
    if (!nuevo.nombre_archivo || !nuevo.id_municipio) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obligatorios',
        detail: 'Debe ingresar nombre y municipio',
      });
      return;
    }

    this.apiArchivos_municipio.createArchivo(nuevo).subscribe({
      next: (resp) => {
        this.archivos_municipio.update((a) => [...a, resp.data]);
        this.cargarArchivos();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Archivo creado correctamente',
        });
        this.nuevoArchivoDialog.set(false);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el archivo',
        });
      },
    });
  }

  // ✅ Tipado correcto del evento
  handleSave(event: { data: Partial<Archivos_municipio>; file: File | null }): void {
    const { data, file } = event;

    // Validaciones
    if (
      !data.nombre_archivo ||
      !data.id_municipio ||
      !data.tipo_archivo ||
      !data.categoria_archivo
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Complete todos los campos obligatorios',
        life: 3000,
      });
      this.archivoForm?.cancelSave();
      return;
    }

    if (!this.isEditMode() && !file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo requerido',
        detail: 'Debe seleccionar un archivo',
        life: 3000,
      });
      this.archivoForm?.cancelSave();
      return;
    }

    // Crear FormData
    const formData = new FormData();
    if (file) {
      formData.append('archivo', file);
    }
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('id_municipio', data.id_municipio!.toString());
    formData.append('tipo_archivo', data.tipo_archivo);
    formData.append('categoria_archivo', data.categoria_archivo);
    formData.append('estatus_archivo', data.estatus_archivo || 'A');

    if (data.palabras_clave) {
      formData.append('palabras_clave', data.palabras_clave);
    }
    if (data.subcategoria_archivo) {
      formData.append('subcategoria_archivo', data.subcategoria_archivo);
    }

    // ✅ Para debugging: ver el contenido del FormData
    console.log('=== CONTENIDO DEL FORMDATA ===');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    // Descomentar cuando esté listo el backend

    this.apiArchivos_municipio.createArchivoConUpload(formData).subscribe({
      next: (resp) => {
        console.log('Archivo creado:', resp.data);
        this.messageService.add({
          severity: 'success',
          summary: '¡Éxito!',
          detail: 'Archivo creado correctamente',
          life: 3000,
        });
        this.archivoForm?.completeSave();
        this.table.reset();
      },
      error: (err) => {
        console.error('Error al crear archivo:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo crear el archivo',
          life: 5000,
        });
        this.archivoForm?.cancelSave();
      },
    });

    // Temporal: simular éxito
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: '¡Éxito!',
        detail: 'Archivo creado correctamente',
        life: 3000,
      });
      this.archivoForm?.completeSave();
      this.table.reset();
    }, 1000);
  }

  deleteArchivo(archivo: Archivos_municipio): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${archivo.nombre_archivo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.apiArchivos_municipio.deleteArchivo(archivo.id_archivo).subscribe({
          next: () => {
            this.archivos_municipio.update((a) =>
              a.filter((x) => x.id_archivo !== archivo.id_archivo)
            );
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Archivo eliminado correctamente',
              life: 3000,
            });
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo eliminar el archivo',
            });
          },
        });
      },
      reject: () =>
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'No se eliminó el archivo',
        }),
    });
  }

  deleteSelectedArchivos(): void {
    const selected = this.selectedArchivos();
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar ${selected.length} archivo(s) seleccionado(s)?`,
      header: 'Confirmar Eliminación Múltiple',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar todos',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminados',
          detail: 'Archivos eliminados correctamente',
          life: 3000,
        });
        this.selectedArchivos.set([]);
        this.table.reset();
      },
    });
  }

  exportCSV(): void {
    this.table.exportCSV();
    this.messageService.add({
      severity: 'success',
      summary: 'Exportando',
      detail: 'Generando archivo CSV...',
      life: 2000,
    });
  }

  // ⚙️ Utilidades
  clear(table: Table): void {
    table.clear();
    this.filtrosActivos.set({});
    this.ordenActual.set(null);
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros Limpiados',
      detail: 'Se han eliminado todos los filtros',
    });
  }

  getSeverity(estatus: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (estatus) {
      case 'A':
      case 'Activo':
        return 'success';
      case 'I':
      case 'Inactivo':
        return 'danger';
      case 'Pendiente':
        return 'warn';
      case 'Archivado':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getFileIcon(tipo: string): string {
    const map: Record<string, string> = {
      PDF: 'text-red-500',
      Excel: 'text-green-500',
      Word: 'text-blue-500',
      Imagen: 'text-purple-500',
      ZIP: 'text-yellow-500',
    };
    return map[tipo] ?? 'text-gray-500';
  }

  editArchivo(archivo: Archivos_municipio) {
    // Editar archivo seleccionado
    /* this.messageService.add({
      severity: 'info',
      summary: 'Editar',
      detail: `Editando: ${archivo.nombre_archivo}`,
    }); */
    // Aquí implementarías la lógica para editar
    // Por ejemplo: abrir un diálogo con los datos del archivo
  }

  downloadArchivo(archivo: Archivos_municipio) {
    /* this.messageService.add({
      severity: 'success',
      summary: 'Descargando',
      detail: `Descargando: ${archivo.nombre_archivo}`,
    }); */

    // El campo 'archivo' contiene el nombre del archivo, no base64
    // Asumiendo que tienes una ruta base para los archivos
    if (archivo.archivo) {
      // Opción 1: Si tienes una URL base para descargar archivos
      const baseUrl = 'tu-url-base/archivos/'; // Ajusta según tu API
      window.open(baseUrl + archivo.archivo, '_blank');

      // Opción 2: Si necesitas hacer una petición HTTP para obtener el archivo
      // this.apiArchivos_municipio.downloadFile(archivo.id_archivo).subscribe({
      //   next: (blob) => {
      //     const url = window.URL.createObjectURL(blob);
      //     const link = document.createElement('a');
      //     link.href = url;
      //     link.download = archivo.nombre_archivo;
      //     link.click();
      //     window.URL.revokeObjectURL(url);
      //   },
      //   error: (err) => {
      //     console.error('Error al descargar:', err);
      //     this.messageService.add({
      //       severity: 'error',
      //       summary: 'Error',
      //       detail: 'No se pudo descargar el archivo'
      //     });
      //   }
      // });
    }
  }

  //-----------------------------------------------
}
