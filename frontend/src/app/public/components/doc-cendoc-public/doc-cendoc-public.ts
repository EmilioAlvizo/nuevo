// nuevo/frontend/src/app/public/components/arch-municipio-public/arch-municipio-public.ts
import { Injectable, inject, signal, computed, ViewChild } from '@angular/core';
import { map, Observable, forkJoin } from 'rxjs';
import { ApiDocumentos_cendoc, Documentos_cendoc } from '../../../core/services/documentos_cendoc';
import { ApiCategoriaCendoc, Categoria_cendoc } from '../../../core/services/categorias_cendoc';
import { environment } from '../../../../environments/environment';
import {
  TableStrategy,
  FilterConfig,
  TableParams,
  TableData,
  TableColumn,
} from '../../../shared/tabla-dinamica/tabla-dinamica';

import { TablaGenerica, ColumnConfig } from '../../../admin/shared/tabla-generica/tabla-generica';
import { Table } from 'primeng/table';

@Injectable({
  providedIn: 'root',
})
export class DocCendocPublic implements TableStrategy {
  publicUrl = environment.publicUrl;
  private categoria_cendocService = inject(ApiCategoriaCendoc);
  private archivosService = inject(ApiDocumentos_cendoc);

  // 1. CONFIGURACIÓN VISUAL DE LA TARJETA
  getColumns(): TableColumn[] {
    return [
      {
        key: 'nombre_documento',
        label: 'Nombre',
        role: 'title', // ESTE SERÁ EL ENCABEZADO DE LA CARD
      },
      {
        key: 'nombre_categoria',
        label: 'Categoría',
        type: 'badge',
        role: 'subtitle',
      },
      {
        key: 'autor_documento', // Ojo: Asegúrate que tu back devuelva esto o haz join aquí
        label: 'Autor',
        role: 'body',
      },
      {
        key: 'fecha_documento',
        label: 'Publicado',
        type: 'date',
        role: 'body',
      },
      {
        key: 'palabras_clave',
        label: 'Palabras Clave',
        type: 'badge',
        role: 'footer',
      },
      // 👇 Nueva columna para el botón de descarga
      {
        key: 'url_descarga',
        label: 'Ver documento', // El texto que saldrá en el botón
        type: 'link', // Tipo especial para que la tabla sepa que es un enlace
        role: 'footer', // Ubicación en la card
      },
    ];
  }

  // 2. CARGA DE FILTROS (Igual que antes)
  initFilters(): Observable<FilterConfig[]> {
    return forkJoin({
      unicos: this.archivosService.getValoresUnicos(),
      categorias: this.categoria_cendocService.get(),
    }).pipe(
      map(({ unicos, categorias }) => {
        const data = unicos.data;
        const listaCategorias = categorias.data;
        //console.log("data ",data)
        //console.log("listaCategorias ",listaCategorias)

        return [
          {
            key: 'autor_documento',
            label: 'Autor',
            type: 'checkbox',
            expandido: false,
            opciones: (data.autor_documento || []).map((cat: string) => ({
              label: cat,
              value: cat,
            })),
          },
          {
            key: 'id_categoria_cendoc',
            label: 'Categoría',
            type: 'checkbox',
            expandido: false,
            busquedaInterna: '',
            opciones: (data.id_categoria_cendoc || []).map((id: number) => {
              const m = listaCategorias.find((mu: any) => mu.id_categoria_cendoc === id);
              return { label: m ? m.nombre_categoria_cendoc : `ID ${id}`, value: id };
            }),
          },
        ];
      })
    );
  }

  // 3. OBTENCIÓN DE DATOS (CON ORDENAMIENTO)
  getData(params: TableParams): Observable<TableData> {
    // --- LÓGICA DE MAPEO DE ORDENAMIENTO ---
    let sortField: string | undefined;
    let sortOrder: number | undefined;

    switch (params.sort) {
      case 'masReciente':
        sortField = 'fecha_modificacion';
        sortOrder = -1; // Descendente (del más nuevo al más viejo)
        break;
      case 'masAntiguo':
        sortField = 'fecha_modificacion';
        sortOrder = 1; // Ascendente
        break;
      case 'AZ':
        sortField = 'nombre_documento';
        sortOrder = 1; // A-Z
        break;
      case 'ZA':
        sortField = 'nombre_documento';
        sortOrder = -1; // Z-A
        break;
      case 'masRelevante':
      default:
        // Si quieres un orden por defecto o dejar que el back decida
        sortField = undefined;
        sortOrder = undefined;
        break;
    }
    //console.log('parametros ', params);

    // Construimos los parámetros finales para el servicio
    const backendParams: any = {
      pagina: params.page,
      limite: params.limit,
      busqueda: params.search,
      // Esparcimos los filtros dinámicos (id_municipio, categoria_archivo, etc.)
      ...params.filters,
      // Agregamos los campos de ordenamiento que espera el backend
      sortField,
      sortOrder,
    };

    return this.archivosService.getFiltrados(backendParams).pipe(
      map((res) => {
        // 👇 Transformamos la data para construir la URL completa
        const dataConUrl = res.data.map((item: any) => ({
          ...item,
          // Construcción de la ruta: publicUrl + carpeta + id + nombre_archivo
          url_descarga: `${environment.publicUrl}/documentos_cendoc/${item.id_documento}/${item.archivo_documento}`,
        }));

        return {
          data: dataConUrl,
          total: res.total || 0,
        };
      })
    );
  }

  // 👇 NUEVO: Implementación para tabla-generica
  getTableGenericaColumns(): ColumnConfig[] {
    return this.columns();
  }

  getDataService(): any {
    return this.archivosService;
  }

  readonly categorias = signal<Categoria_cendoc[]>([]);

  revistaToEdit: Documentos_cendoc | null = null;
  refrescarTabla = signal(0);

  isEditMode = signal<boolean>(false);
  archivoToEdit = signal<Documentos_cendoc | null>(null);

  @ViewChild('dt') table!: Table;

  readonly columns = computed<ColumnConfig[]>(() => [
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
      loadOptionsFromBackend: true,
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
      loadOptionsFromBackend: true,
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
  ]);

  // 👇 NUEVO: Implementación de acciones para tabla-dinamica
  onView(item: any) {
    if (!item || !item.id_documento) {
      console.warn('No se encontró el documento seleccionado.');
      return;
    }

    // 📁 Ruta al archivo (ajusta según tu estructura)
    const fileUrl = `${this.publicUrl}/documentos_cendoc/${item.id_documento}/${item.archivo_documento}`;

    // 🔍 Abrir el archivo en una nueva pestaña
    window.open(fileUrl, '_blank');
  }

  // Método legacy (mantener si se usa en otros lugares)
  ver(doc: Documentos_cendoc) {
    this.onView(doc);
  }
}