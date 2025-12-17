// nuevo/frontend/src/app/admin/pages/centro-documental-admin/centro-documental-admin.ts

import { Component, signal, WritableSignal, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApiDocumentosFisicos, DocumentoFisico } from '../../../core/services/documentos_fisicos';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { FormRevistas } from '../../components/form-revistas/form-revistas';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-centro-documental-admin',
  imports: [
    CommonModule,
    FormsModule,
    TablaGenerica,
    DialogModule,
    FormRevistas,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './centro-documental-admin.html',
  styleUrl: './centro-documental-admin.css',
})
export class CentroDocumentalAdmin {
  publicUrl = environment.publicUrl;
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  //-------------------------------------------------
  showDialog: WritableSignal<boolean> = signal(false);
  revistaToEdit: DocumentoFisico | null = null;
  refrescarTabla = signal(0);

  Service: ApiDocumentosFisicos;
  columns: ColumnConfig[] = [
    {
      field: 'id_documento',
      header: 'Id',
      sortable: true,
      filterable: true,
      filterType: 'numeric',
      tooltip: false,
    },
    {
      field: 'clave',
      header: 'Clave',
      sortable: true,
      filterable: true,
      filterType: 'numeric',
      tooltip: false,
    },
    {
      field: 'titulo',
      header: 'Titulo',
      sortable: true,
      filterable: true,
      tooltip: true,
      width: '250px',
    },

    {
      field: 'ejemplares',
      header: 'Ejemplares',
      sortable: true,
      filterable: true,
      filterType: 'text',
      tooltip: false,
    },
    {
      field: 'estatus',
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
        { label: 'Inactivo', value: 'I' },
      ],
    },
    {
      field: 'fecha_modificacion',
      header: 'Fecha',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'custom',
      customDateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }, // 05/11/2025, 14:30
    },
  ];

  constructor(private apiDocumentosFisicos: ApiDocumentosFisicos) {
    this.Service = apiDocumentosFisicos;
  }

  agregar() {
    this.revistaToEdit = null;
    this.showDialog.set(true);
  }

  editar(revista: any) {
    //console.log('Editar revista:', revista);
    this.revistaToEdit = revista; // 📌 Guarda la revista seleccionada
    this.showDialog.set(true); // 📌 Abre el diálogo
  }

  eliminar(revista: DocumentoFisico) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${revista.id_documento}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.apiDocumentosFisicos.eliminar(revista.id_documento).subscribe({
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

  ver(revista: any) {
    if (!revista || !revista.id_documento) {
      console.warn('No se encontró la revista seleccionada.');
      return;
    }

    // 📁 Ruta al archivo de la revista (ajusta el nombre del archivo si cambia)
    const fileUrl = `${this.publicUrl}revistas/${revista.id_documento}/archivo/${revista.archivo}`;

    // 🔍 Opción 1: Abrir el archivo en una nueva pestaña
    window.open(fileUrl, '_blank');

    // 🔽 Opción 2: Descargar automáticamente
    // const link = document.createElement('a');
    // link.href = fileUrl;
    // link.download = `${revista.volumen || 'revista'}.pdf`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  }
  guardarRevista(formData: FormData) {
    const isEdit = !!this.revistaToEdit;

    const request = isEdit
      ? this.Service.actualizar(this.revistaToEdit!.id_documento, formData)
      : this.Service.crear(formData);

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
          detail: 'No se pudo guardar la revista',
        });
      },
    });
  }
}
