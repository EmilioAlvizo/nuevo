
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
  templateUrl: './tabla-b.html',
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
    { label: 'Inactivo', value: 'B' as const },
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

  loadArchivos(event: TableLazyLoadEvent): void {
    this.loading.set(true);

    const params: LazyLoadParams = {
      limite: event.rows || 10,
      pagina: (event.first || 0) / (event.rows || 10) + 1,
      ordenar: this.getOrdenarParam(
        event.sortField as string,
        event.sortOrder || 1
      ),
      busqueda: (event.globalFilter as string) || undefined,
    };

    this.apiArchivos_municipio.getArchivosFiltrados(params).subscribe({
      next: (response) => {
        this.archivos_municipio.set(response.data);
        this.totalRecords.set(response.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar archivos:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los archivos',
          life: 3000,
        });
      },
    });
  }

  getOrdenarParam(field: string, order: number): string {
    if (!field) return 'masReciente';

    const isAsc = order === 1;
    if (field === 'nombre_archivo') {
      return isAsc ? 'AZ' : 'ZA';
    }
    if (field === 'fecha_modificacion') {
      return isAsc ? 'masAntiguo' : 'masReciente';
    }
    return 'masReciente';
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

  handleSave(event: { data: Partial<Archivos_municipio>; file: File | null }): void {
    const { data, file } = event;

    // Validaciones básicas
    if (!data.nombre_archivo || !data.id_municipio || !data.tipo_archivo || !data.categoria_archivo) {
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

    // 🧾 Crear FormData para envío
    const formData = new FormData();
    if (file) formData.append('archivo', file, file.name);

    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('id_municipio', data.id_municipio!.toString());
    formData.append('tipo_archivo', data.tipo_archivo);
    formData.append('categoria_archivo', data.categoria_archivo);
    formData.append('estatus_archivo', data.estatus_archivo || 'A');
    if (data.fecha_archivo) {
    formData.append('fecha_archivo', data.fecha_archivo); // sin conversión de zona horaria
  }

    if (data.palabras_clave) formData.append('palabras_clave', data.palabras_clave);
    if (data.subcategoria_archivo) formData.append('subcategoria_archivo', data.subcategoria_archivo);


    console.log('📤 Enviando FormData a backend...');

    const request$ = this.isEditMode()
      ? this.apiArchivos_municipio.updateArchivo(this.archivoToEdit()!.id_archivo, formData)
      : this.apiArchivos_municipio.createArchivo(formData);

    request$.subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del servidor:', resp);
        this.messageService.add({
          severity: 'success',
          summary: '¡Éxito!',
          detail: this.isEditMode() ? 'Archivo actualizado correctamente' : 'Archivo creado correctamente',
          life: 3000,
        });
        this.archivoForm?.completeSave();
        this.showDialog.set(false);
        this.table.reset();
      },
      error: (err) => {
        console.error('💥 Error al guardar archivo:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo guardar el archivo',
          life: 5000,
        });
        this.archivoForm?.cancelSave();
      },
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

  editArchivo(archivo: Archivos_municipio): void {
    this.isEditMode.set(true);
    this.archivoToEdit.set(archivo);

    // 🔧 Cargar los datos directamente en el formulario del hijo
    this.archivoForm?.loadArchivoData(archivo);

    // Mostrar el diálogo
    this.showDialog.set(true);

    this.messageService.add({
      severity: 'info',
      summary: 'Editar archivo',
      detail: `Editando: ${archivo.nombre_archivo}`,
      life: 2000,
    });
  }

  downloadArchivo(archivo: Archivos_municipio) {
  if (archivo.archivo) {
    // Base URL de tu API o servidor de archivos
    const baseUrl = 'http://localhost:3000/public/archivos_municipio/';

    // Asegúrate de usar interpolación de strings o concatenación adecuada
    const url = `${baseUrl}${archivo.id_archivo}/${archivo.archivo}`;
    // Alternativa sin interpolación: const url = baseUrl + archivo.id_archivo + '/' + archivo.archivo;

    window.open(url, '_blank');
  } else {
    console.error('No se encontró el nombre del archivo');
  }
}

}