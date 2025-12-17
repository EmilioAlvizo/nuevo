// nuevo/frontend/src/app/admin/components/tabla-doc-cendoc/tabla-doc-cendoc.ts
import { ConfirmationService, MessageService } from 'primeng/api';

import { Component, inject, signal, WritableSignal, computed, effect } from '@angular/core';
import { ApiDocumentos_cendoc, Documentos_cendoc } from '../../../core/services/documentos_cendoc';
import { ApiCategoriaCendoc, Categoria_cendoc } from '../../../core/services/categorias_cendoc';
import { TablaGenerica, ColumnConfig } from '../../shared/tabla-generica/tabla-generica';
import { FormDocCendoc } from '../../../admin/components/form-doc-cendoc/form-doc-cendoc';
import { environment } from '../../../../environments/environment';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-tabla-doc-cendoc',
  imports: [TablaGenerica, FormDocCendoc, ConfirmDialogModule, ToastModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tabla-doc-cendoc.html',
  styleUrl: './tabla-doc-cendoc.css',
})
export class TablaDocCendoc {
  publicUrl = environment.publicUrl;
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  documentosCendocService: ApiDocumentos_cendoc = inject(ApiDocumentos_cendoc);
  
  // ✅ INYECTAR el servicio de categorías
  private apiCategoriaCendoc = inject(ApiCategoriaCendoc);

  readonly categorias = signal<Categoria_cendoc[]>([]);

  showDialog: WritableSignal<boolean> = signal(false);
  revistaToEdit = signal<Documentos_cendoc | null>(null);
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
      field: 'id_documento',
      header: 'Id',
      sortable: true,
      filterable: true,
      filterType: 'numeric',
      tooltip: false,
    },
    {
      field: 'nombre_documento',
      header: 'Nombre',
      width: '200px',
      sortable: true,
      filterable: true,
      filterType: 'text',
      tooltip: true,
    },
    {
      field: 'autor_documento',
      header: 'Autor',
      width: '200px',
      sortable: true,
      filterable: true,
      tooltip: false,
    },

    {
      field: 'descripcion_documento',
      header: 'Descripción',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '200px',
      tooltip: true,
    },
    {
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
    },
    {
      field: 'palabras_clave',
      header: 'Palabra Clave',
      width: '200px',
      sortable: true,
      filterable: true,
      filterType: 'text',
      tooltip: true,
    },
    {
      field: 'fecha_documento',
      header: 'Fecha',
      sortable: true,
      filterable: true,
      filterType: 'date',
      tooltip: false,
      dateFormat: 'long',
    },

    {
      field: 'estatus_documento',
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
        const categoriaColumn = this.columns.find(c => c.field === 'nombre_categoria');
        if (categoriaColumn) {
          categoriaColumn.options = res.data.map(cat => ({
            label: cat.nombre_categoria_cendoc,
            value: cat.nombre_categoria_cendoc
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
    this.revistaToEdit.set(null);
    this.showDialog.set(true);
  }

  editar(doc: any) {
    //console.log('Editar doc:', doc);
    this.revistaToEdit.set(doc); // 📌 Guarda la doc seleccionada
    this.showDialog.set(true); // 📌 Abre el diálogo
  }

  eliminar(doc: Documentos_cendoc) {
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
    const revista = this.revistaToEdit();   // obtener valor del signal
    const isEdit = !!revista;               // true si tiene un documento cargado
  
    const request = isEdit
      ? this.documentosCendocService.actualizar(revista!.id_documento, formData)
      : this.documentosCendocService.crear(formData);
  
    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: isEdit ? 'Revista actualizada' : 'Revista creada',
          life: 3000
        });
  
        this.showDialog.set(false);
        this.refrescarTabla.update(v => v + 1);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la doc'
        });
      }
    });
  }
}
