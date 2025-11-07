// nuevo/frontend/src/app/admin/pages/revista-voces-admin/revista-voces-admin.ts
import {
  Component,
  signal,
  WritableSignal,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { FormRevistas } from '../../components/form-revistas/form-revistas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-revista-voces-admin',
  standalone: true,
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
  templateUrl: './revista-voces-admin.html',
  styleUrl: './revista-voces-admin.css',
})
export class RevistaVocesAdmin {
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  //-------------------------------------------------
  showDialog: WritableSignal<boolean> = signal(false);
  revistaToEdit: Revistas | null = null;
  refrescarTabla = signal(0);

  revistasService: ApiRevistas;
  columns: ColumnConfig[] = [
    {
      field: 'id_revista',
      header: 'Id',
      sortable: true,
      filterable: true,
      filterType: 'numeric',
      tooltip: false,
    },
    {
      field: 'portada',
      header: 'Portada',
      width: '120px',
      template: (row) => {
        const imagePath = `http://localhost:3000/public/revistas/${row.id_revista}/portada/${row.portada}`; // o portada.jpg si es necesario
        return `<img src="${imagePath}" alt="Portada" width="60" height="80" class="w-24 rounded">`;
      },
      tooltip: false,
    },
    { field: 'volumen', header: 'Volumen', sortable: true, filterable: true, tooltip: false },
    {
      field: 'fecha',
      header: 'Fecha',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
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
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '500px',
      tooltip: true,
    },
  ];

  constructor(private apiRevistas: ApiRevistas) {
    this.revistasService = apiRevistas;
  }

  agregar() {
    this.revistaToEdit = null;
    this.showDialog.set(true);
  }

  editar(revista: any) {
    console.log('Editar revista:', revista);
    this.revistaToEdit = revista; // 📌 Guarda la revista seleccionada
    this.showDialog.set(true); // 📌 Abre el diálogo
  }

  eliminar(revista: Revistas) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${revista.id_revista}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.apiRevistas.eliminarRevista(revista.id_revista).subscribe({
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
    console.log('Ver revista:', revista);
  }

  guardarRevista(formData: FormData) {
    const isEdit = !!this.revistaToEdit;

    const request = isEdit
      ? this.revistasService.actualizarRevista(this.revistaToEdit!.id_revista, formData)
      : this.revistasService.crearRevista(formData);

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