// nuevo/frontend/src/app/admin/components/tabla-arch-municipios/tabla-arch-municipios.ts
import { Component, inject, signal, WritableSignal, computed, effect } from '@angular/core';

import {
  ApiArchivos_municipio,
  Archivos_municipio,
} from '../../../core/services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { environment } from '../../../../environments/environment';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-tabla-arch-municipios',
  imports: [TablaGenerica, ConfirmDialogModule, ToastModule],
  providers: [MessageService, ConfirmationService],
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
    console.log("qqqqqqqqqqq ", this.municipios())
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
      field: 'fecha_modificacion',
      header: 'Fecha',
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
    this.showDialog.set(true);
    console.log('asdasd ', this.municipiosOptions());
  }

  editar(doc: any) {
    console.log('Editar doc:', doc);
    this.revistaToEdit = doc; // 📌 Guarda la doc seleccionada
    this.showDialog.set(true); // 📌 Abre el diálogo
  }

  /* eliminar(doc: Documentos_cendoc) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${doc.id_documento}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.documentosCendocService.eliminar(doc.id_documento).subscribe({
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

  ver(doc: any) {
    if (!doc || !doc.id_documento) {
      console.warn('No se encontró la doc seleccionada.');
      return;
    }

    // 📁 Ruta al archivo de la doc (ajusta el nombre del archivo si cambia)
    const fileUrl = `${this.publicUrl}/documentos_cendoc/${doc.id_documento}/${doc.archivo_documento}`;

    // 🔍 Opción 1: Abrir el archivo en una nueva pestaña
    window.open(fileUrl, '_blank');

    // 🔽 Opción 2: Descargar automáticamente
    // const link = document.createElement('a');
    // link.href = fileUrl;
    // link.download = `${doc.volumen || 'doc'}.pdf`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  }

  guardar(formData: FormData) {
    const isEdit = !!this.revistaToEdit;

    const request = isEdit
      ? this.documentosCendocService.actualizar(this.revistaToEdit!.id_documento, formData)
      : this.documentosCendocService.crear(formData);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: isEdit ? 'Revista actualizada' : 'Revista creada',
          life: 3000,
        });
        this.showDialog.set(false);
        this.refrescarTabla.update((v) => v + 1);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la doc',
        });
      },
    });
  } */
}
