// nuevo/frontend/src/app/public/components/arch-municipio-public/arch-municipio-public.ts
import { Injectable, inject, signal, computed, ViewChild } from '@angular/core';
import { map, Observable, forkJoin } from 'rxjs';
import { ApiArchivos_municipio, Archivos_municipio } from '../../../core/services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
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
export class ArchMunicipioPublic implements TableStrategy {
  constructor(
    private archivosService: ApiArchivos_municipio,
    private municipiosService: ApiMunicipio
    
  ) {
    // Cargar municipios al iniciar (para casos especiales)
    this.apiMunicipio.getMessage().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.municipios.set(resp.data);
        }
      },
      error: (err) => console.error('Error cargando municipios:', err),
    });
  }

  // 1. CONFIGURACIÓN VISUAL DE LA TARJETA
  getColumns(): TableColumn[] {
    return [
      {
        key: 'nombre_archivo',
        label: 'Nombre',
        role: 'title', // ESTE SERÁ EL ENCABEZADO DE LA CARD
      },
      {
        key: 'categoria_archivo',
        label: 'Categoría',
        type: 'badge',
        role: 'subtitle',
      },
      {
        key: 'nombre_municipio', // Ojo: Asegúrate que tu back devuelva esto o haz join aquí
        label: 'Municipio',
        role: 'body',
      },
      {
        key: 'fecha_archivo',
        label: 'Publicado',
        type: 'date',
        role: 'body',
      },
      {
        key: 'tipo_archivo',
        label: 'Tipo',
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
      municipios: this.municipiosService.getMessage(),
    }).pipe(
      map(({ unicos, municipios }) => {
        const data = unicos.data;
        const listaMunicipios = municipios.data;

        return [
          {
            key: 'categoria_archivo',
            label: 'Categoría',
            type: 'checkbox',
            expandido: true,
            opciones: (data.categoria_archivo || []).map((cat: string) => ({
              label: cat,
              value: cat,
            })),
          },
          {
            key: 'id_municipio',
            label: 'Municipio',
            type: 'checkbox',
            expandido: false,
            busquedaInterna: '',
            opciones: (data.id_municipio || []).map((id: number) => {
              const m = listaMunicipios.find((mu: any) => mu.id_municipio === id);
              return { label: m ? m.nombre : `ID ${id}`, value: id };
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
        sortField = 'nombre_archivo';
        sortOrder = 1; // A-Z
        break;
      case 'ZA':
        sortField = 'nombre_archivo';
        sortOrder = -1; // Z-A
        break;
      case 'masRelevante':
      default:
        // Si quieres un orden por defecto o dejar que el back decida
        sortField = undefined;
        sortOrder = undefined;
        break;
    }
    console.log('parametros ', params);

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
          url_descarga: `${environment.publicUrl}/archivos_municipio/${item.id_archivo}/${item.archivo}`,
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
    return this.apiArchivos_municipio;
  }

  publicUrl = environment.publicUrl;
  private apiMunicipio = inject(ApiMunicipio);
  apiArchivos_municipio = inject(ApiArchivos_municipio);

  readonly municipios = signal<Municipio[]>([]);

  revistaToEdit: Archivos_municipio | null = null;
  refrescarTabla = signal(0);

  isEditMode = signal<boolean>(false);
  archivoToEdit = signal<Archivos_municipio | null>(null);

  @ViewChild('dt') table!: Table;

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

  // 👇 NUEVO: Implementación de acciones para tabla-dinamica
  onView(item: any) {
    if (!item || !item.id_archivo) {
      console.warn('No se encontró el documento seleccionado.');
      return;
    }

    // 📁 Ruta al archivo (ajusta según tu estructura)
    const fileUrl = `${this.publicUrl}/archivos_municipio/${item.id_archivo}/${item.archivo}`;

    // 🔍 Abrir el archivo en una nueva pestaña
    window.open(fileUrl, '_blank');
  }

  // Método legacy (mantener si se usa en otros lugares)
  ver(doc: Archivos_municipio) {
    this.onView(doc);
  }
}