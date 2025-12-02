import { ConfirmationService, MessageService } from 'primeng/api';

import { Component, inject, signal, WritableSignal, computed, effect } from '@angular/core';
import { ApiEncuestas, Encuesta } from '../../../core/services/encuestas';
import { ApiCategoriaCendoc, Categoria_cendoc } from '../../../core/services/categorias_cendoc';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { FormEncuestas } from '../../../admin/components/form-encuestas/form-encuestas';
import { environment } from '../../../../environments/environment';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-encuestas-admin',
  imports: [TablaGenerica, FormEncuestas, ConfirmDialogModule, ToastModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './encuestas-admin.html',
  styleUrl: './encuestas-admin.css',
})
export class EncuestasAdmin {
  publicUrl = environment.publicUrl;
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  documentosCendocService: ApiEncuestas = inject(ApiEncuestas);

  // ✅ INYECTAR el servicio de categorías
  private apiCategoriaCendoc = inject(ApiCategoriaCendoc);

  readonly categorias = signal<Categoria_cendoc[]>([]);

  showDialog: WritableSignal<boolean> = signal(false);
  encuestaToEdit: Encuesta | null = null;
  refrescarTabla = signal(0);

  // 🧠 Computed: opciones de municipios
  readonly categoriasOptions = computed(() =>
    this.categorias().map((m) => ({
      label: m.nombre_categoria_cendoc,
      value: m.id_categoria_cendoc,
    }))
  );

  columns: ColumnConfig[] = [
    {
      field: 'pregunta',
      header: 'Pregunta',
      sortable: true,
      filterable: true,
      filterType: 'text',
      tooltip: false,
    },
    {
      field: 'fechaInicio',
      header: 'Fecha inicio',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },
    /* {
      field: 'nombre_categoria',
      header: 'Categoria',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      // ✅ agrega opciones aquí
      options: [
        { label: 'Discriminación y DH', value: 'Discriminación y DH' },
        { label: 'Economía', value: 'Economía' },
      ],
    }, */
    {
      field: 'fechaFin',
      header: 'Fecha fin',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },
    {
      field: 'fechaCreacion',
      header: 'Fecha creacion',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },
    {
      field: 'fechaModificacion',
      header: 'Fecha modificacion',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },

    {
      field: 'activa',
      header: 'Estatus',
      sortable: true,
      filterable: true,
      filterType: 'multiselect',
      tooltip: false,
      renderAs: 'tag',
      getLabel: (row, field) => (row[field] === true ? 'Activo' : 'Inactivo'),
      getSeverity: (row, field) => (row[field] === true ? 'success' : 'secondary'),
      // ✅ agrega opciones aquí
      options: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ],
    },
  ];

  // ✅ Constructor para cargar las categorías
  constructor() {
    effect(() => this.cargarCategorias());
  }

  // ✅ Método para cargar las categorías
  private cargarCategorias(): void {
    this.apiCategoriaCendoc.get().subscribe({
      next: (res) => {
        this.categorias.set(res.data);

        // ✅ Actualizar las opciones del filtro de categorías dinámicamente
        const categoriaColumn = this.columns.find((c) => c.field === 'nombre_categoria');
        if (categoriaColumn) {
          categoriaColumn.options = res.data.map((cat) => ({
            label: cat.nombre_categoria_cendoc,
            value: cat.nombre_categoria_cendoc,
          }));
        }

        //console.log('✅ Categorías cargadas:', res.data);
      },
      error: (err) => {
        console.error('❌ Error al cargar categorías:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías',
        });
      },
    });
  }

  agregar() {
    this.encuestaToEdit = null;
    this.showDialog.set(true);
  }

  editar(doc: any) {
    console.log('Editar encuesta:', doc);

    // 🔥 AQUÍ HACEMOS LA PETICIÓN COMPLETA
    this.documentosCendocService.getPorId(doc.idEncuesta).subscribe((encuestaCompleta) => {
      console.log('Encuesta con opciones:', encuestaCompleta);

      this.encuestaToEdit = encuestaCompleta; // ← ahora SÍ trae opciones
      this.showDialog.set(true);
    });
  }

  eliminar(doc: Encuesta) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el elemento "${doc.idEncuesta}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.documentosCendocService.eliminar(doc.idEncuesta).subscribe({
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
    const isEdit = !!this.encuestaToEdit;

    const request = isEdit
      ? this.documentosCendocService.actualizar(this.encuestaToEdit!.idEncuesta, formData)
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
  }
}
