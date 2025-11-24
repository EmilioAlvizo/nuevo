import { Component, inject } from '@angular/core';
import { TablaDinamica, ColumnConfig, FilterConfig } from '../../../shared/tabla-dinamica/tabla-dinamica';
import { ApiArchivos_municipio } from '../../../core/services/archivos_municipio';


@Component({
  selector: 'app-tabla-arch-municipios',
  imports: [TablaDinamica],
  templateUrl: './tabla-arch-municipios.html',
  styleUrl: './tabla-arch-municipios.css',
})
export class TablaArchMunicipios {
  archivosService = inject(ApiArchivos_municipio);
  
  // ===== CONFIGURACIÓN PARA ARCHIVOS MUNICIPIO =====
  columnasArchivosMunicipio: ColumnConfig[] = [
    {
      field: 'nombre_archivo',
      header: 'Nombre',
      sortable: true,
      filterable: true,
      width: '200px'
    },
    {
      field: 'categoria_archivo',
      header: 'Categoría',
      sortable: true,
      filterable: true,
      width: '150px',
      badge: true,
      badgeColor: (row) => this.getBadgeColorCategoria(row.categoria_archivo)
    },
    {
      field: 'nombre_municipio',
      header: 'Municipio',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      field: 'fecha_modificacion',
      header: 'Última Modificación',
      sortable: true,
      width: '150px',
      dateFormat: true
    },
    {
      field: 'palabras_clave',
      header: 'Palabras Clave',
      width: '200px'
    },
    {
      field: 'archivo',
      header: 'Descargar',
      template: (row: any) => `<a href="/uploads/${row.archivo}" target="_blank">📄 Descargar</a>`
    }
  ];

  filtrosArchivosMunicipio: FilterConfig[] = [
    {
      field: 'municipio',
      label: 'Por Municipio',
      type: 'select',
      options: [
        { label: 'León', value: 1 },
        { label: 'Silao', value: 2 },
        { label: 'Guanajuato', value: 3 }
      ],
      collapsible: true
    },
    {
      field: 'categoria_archivo',
      label: 'Por Categoría',
      type: 'multiselect',
      placeholder: 'Seleccionar categoría...',
      collapsible: true,
      loadOptionsFromBackend: true, // 👈 Carga del backend
      optionsField: 'categoria_archivo',
    },
    {
      field: 'fecha_inicio',
      label: 'Fecha Desde',
      type: 'date',
      collapsible: true
    },
    {
      field: 'fecha_fin',
      label: 'Fecha Hasta',
      type: 'date',
      collapsible: true
    }
  ];

  // Métodos
  verArchivo(archivo: any): void {
    console.log('Ver archivo:', archivo);
    // Aquí puedes abrir un modal o navegar a una página de detalle
  }

  editarArchivo(archivo: any): void {
    console.log('Editar archivo:', archivo);
    // Aquí puedes abrir un formulario de edición
  }

  eliminarArchivo(archivo: any): void {
    if (confirm('¿Está seguro de que desea eliminar este archivo?')) {
      console.log('Eliminar archivo:', archivo);
      // Aquí puedes hacer la eliminación en el backend
    }
  }

  private getBadgeColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      'administrativos': 'info',
      'financieros': 'success',
      'legales': 'warning',
      'otros': 'secondary'
    };
    return colores[categoria] || 'secondary';
  }
}
