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

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
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
import { Table } from 'primeng/table';

@Component({
  selector: 'app-tabla-a',
  standalone: true,
  imports: [
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
    NuevoArchivoForm
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabla-b.html',
  styleUrl: './tabla-a.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaA {
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

  // ⚙️ Estado UI
  readonly nuevoArchivoDialog = signal(false);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly submitted = signal(false);

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
  handleSave(event: {
    data: Partial<Archivos_municipio>;
    file: File | null;
  }): void {
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

    // Descomentar cuando esté listo el backend
    /*
    this.apiArchivos.createArchivoConUpload(formData).subscribe({
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
    */

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

  customSort(event: any): void {
    event.data.sort((a: any, b: any) => {
      const v1 = a[event.field];
      const v2 = b[event.field];
      if (v1 == null && v2 != null) return -1 * event.order;
      if (v1 != null && v2 == null) return 1 * event.order;
      if (v1 == null && v2 == null) return 0;
      if (typeof v1 === 'string' && typeof v2 === 'string') {
        return event.order * v1.localeCompare(v2);
      }
      return event.order * (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);
    });
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
