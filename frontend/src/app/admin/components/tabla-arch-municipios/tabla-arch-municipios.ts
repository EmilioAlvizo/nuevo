// nuevo/frontend/src/app/admin/components/tabla-arch-municipios/tabla-arch-municipios.ts
import { Component, inject, signal, WritableSignal, computed, effect, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import {
  ApiArchivos_municipio,
  Archivos_municipio,
} from '../../../core/services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { NuevoArchivoForm } from '../../components/nuevo-archivo-form/nuevo-archivo-form';
import { environment } from '../../../../environments/environment';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-tabla-arch-municipios',
  imports: [TablaGenerica, ConfirmDialogModule, ToastModule, NuevoArchivoForm],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-arch-municipios.html',
  styleUrl: './tabla-arch-municipios.css',
})
export class TablaArchMunicipios {
  publicUrl = environment.publicUrl;
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private apiMunicipio = inject(ApiMunicipio);
  apiArchivos_municipio = inject(ApiArchivos_municipio);

  readonly municipios = signal<Municipio[]>([]);

  showDialog: WritableSignal<boolean> = signal(false);
  revistaToEdit: Archivos_municipio | null = null;
  refrescarTabla = signal(0);

  isEditMode = signal<boolean>(false);
  archivoToEdit = signal<Archivos_municipio | null>(null);

  @ViewChild(NuevoArchivoForm) archivoForm?: NuevoArchivoForm;
  @ViewChild('dt') table!: Table;

  constructor() {
    // Cargar municipios al iniciar (para casos especiales)
    this.apiMunicipio.getMessage().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.municipios.set(resp.data);
        }
      },
      error: (err) => console.error('Error cargando municipios:', err)
    });
  }

  // 🧠 Computed: opciones de municipios
  readonly municipiosOptions = computed(() =>
    this.municipios().map((m) => ({
      label: m.nombre,
      value: m.id_municipio,
    }))
  );

  readonly columns = computed<ColumnConfig[]>(() => [
    {
      field: 'nombre_archivo',
      header: 'Nombre Archivo',
      width: '200px',
      sortable: true,
      filterable: true,
      filterType: 'text',
      tooltip: true,
    },
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
      backendField: 'id_municipio', 
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
      field: 'subcategoria_archivo',
      header: 'Subcategoria',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      // ✅ agrega opciones aquí
      loadOptionsFromBackend: true, // 👈 Carga opciones desde backend
      optionsField: 'subcategoria_archivo',
    },
    {
      field: 'fecha_archivo',
      header: 'Fecha',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },
    {
      field: 'fecha_modificacion',
      header: 'Fecha de modificacion',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },
    {
      field: 'estatus_archivo',
      header: 'Estatus',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      getLabel: (row, field) => (row[field] === 'A' ? 'Activo' : 'Inactivo'),
      getSeverity: (row, field) => (row[field] === 'A' ? 'success' : 'secondary'),
      // ✅ agrega opciones aquí
      options: [
        { label: 'Activo', value: 'A' },
        { label: 'Inactivo', value: 'B' },
      ],
    },
  ]);

  agregar() {
    this.revistaToEdit = null;
    this.isEditMode.set(false);       // Aseguramos que el signal sea false
    this.archivoToEdit.set(null);
    this.showDialog.set(true);
    //console.log('asdasd ', this.municipiosOptions());
  }

  editar(doc: any) {
    console.log('Editar doc:', doc);
    this.revistaToEdit = doc; // 📌 Guarda la doc seleccionada
    this.isEditMode.set(true);        // Activamos la bandera de edición
    this.archivoToEdit.set(doc);
    this.showDialog.set(true); // 📌 Abre el diálogo
  }

  ver(doc: Archivos_municipio) {
    if (!doc || !doc.id_archivo) {
      console.warn('No se encontró la doc seleccionada.');
      return;
    }

    // 📁 Ruta al archivo de la doc (ajusta el nombre del archivo si cambia)
    const fileUrl = `${this.publicUrl}/archivos_municipio/${doc.id_archivo}/${doc.archivo}`;

    // 🔍 Opción 1: Abrir el archivo en una nueva pestaña
    window.open(fileUrl, '_blank');
  }

  eliminar(doc: Archivos_municipio) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${doc.id_archivo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.apiArchivos_municipio.deleteArchivo(doc.id_archivo).subscribe({
          next: (resp) => {
            //console.error(resp);
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Elemento eliminado correctamente',
              life: 3000,
            });
            this.refrescarTabla.update((v) => v + 1);
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

  handleSave(formData: FormData/* event: { data: Partial<Archivos_municipio>; file: File | null } */): void {
    //const { data, file } = event;

    // Validaciones básicas
    /* if (!data.nombre_archivo || !data.id_municipio || !data.tipo_archivo || !data.categoria_archivo) {
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
    } */

    /* // 🧾 Crear FormData para envío
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
    if (data.subcategoria_archivo) formData.append('subcategoria_archivo', data.subcategoria_archivo); */


    console.log('📤 Enviando FormData a backend...');
    console.log('es edicion:', this.isEditMode());

    const request$ = this.isEditMode()
      ? this.apiArchivos_municipio.updateArchivo(this.archivoToEdit()!.id_archivo, formData)
      : this.apiArchivos_municipio.createArchivo(formData);

    request$.subscribe({
      next: (resp) => {
        //console.log('✅ Respuesta del servidor:', resp);
        this.messageService.add({
          severity: 'success',
          summary: '¡Éxito!',
          detail: this.isEditMode() ? 'Archivo actualizado correctamente' : 'Archivo creado correctamente',
          life: 3000,
        });
        //this.archivoForm?.completeSave();
        this.showDialog.set(false);
        this.refrescarTabla.update((v) => v + 1);
      },
      error: (err) => {
        console.error('💥 Error al guardar archivo:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo guardar el archivo',
          life: 5000,
        });
        //this.archivoForm?.cancelSave();
      },
    });
  }
}