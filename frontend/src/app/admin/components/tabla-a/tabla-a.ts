import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiArchivos_municipio, Archivos_municipio } from '../../../services/archivos_municipio';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
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
import { Table } from 'primeng/table';

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
    SelectModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabla-a.html',
  styleUrl: './tabla-a.css',
})
export class TablaA {
  Archivos_municipio: Archivos_municipio[] = [];
  selectedArchivos: Archivos_municipio[] = [];
  loading: boolean = true;

  // Opciones para filtros
  tiposArchivo: string[] = ['Resultados', 'Informe', 'Reporte', 'Documento', 'Otro'];
  categorias: string[] = ['Población', 'Económica', 'Social', 'Ambiental', 'Otro'];
  estatusOptions: Array<{label: string, value: 'A' | 'I'}> = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'I' }
  ];

  constructor(
    private apiArchivos_municipio: ApiArchivos_municipio,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarArchivos();
  }

  cargarArchivos(): void {
    this.loading = true;
    this.apiArchivos_municipio.get_archivos().subscribe({
      next: (datos) => {
        this.Archivos_municipio = datos.data;
        this.loading = false;
        console.log('Archivos cargados:', this.Archivos_municipio);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al cargar archivos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los archivos'
        });
      },
    });
  }

  openNew() {
    // Abrir diálogo para nuevo archivo
    this.messageService.add({
      severity: 'info',
      summary: 'Nuevo Archivo',
      detail: 'Función para agregar nuevo archivo'
    });
  }

  editArchivo(archivo: Archivos_municipio) {
    // Editar archivo seleccionado
    this.messageService.add({
      severity: 'info',
      summary: 'Editar',
      detail: `Editando: ${archivo.nombre_archivo}`
    });
    // Aquí implementarías la lógica para editar
    // Por ejemplo: abrir un diálogo con los datos del archivo
  }

  deleteArchivo(archivo: Archivos_municipio) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el archivo "${archivo.nombre_archivo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        // Aquí llamarías a tu servicio para eliminar
        // this.apiArchivos_municipio.deleteArchivo(archivo.id_archivo).subscribe({
        //   next: () => {
        //     this.Archivos_municipio = this.Archivos_municipio.filter(a => a.id_archivo !== archivo.id_archivo);
        //     this.messageService.add({
        //       severity: 'success',
        //       summary: 'Eliminado',
        //       detail: 'Archivo eliminado correctamente'
        //     });
        //   },
        //   error: (err) => {
        //     console.error('Error al eliminar:', err);
        //     this.messageService.add({
        //       severity: 'error',
        //       summary: 'Error',
        //       detail: 'No se pudo eliminar el archivo'
        //     });
        //   }
        // });

        // Mientras tanto, eliminación local:
        this.Archivos_municipio = this.Archivos_municipio.filter(a => a.id_archivo !== archivo.id_archivo);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Archivo eliminado correctamente'
        });
      }
    });
  }

  downloadArchivo(archivo: Archivos_municipio) {
    this.messageService.add({
      severity: 'success',
      summary: 'Descargando',
      detail: `Descargando: ${archivo.nombre_archivo}`
    });
    
    // El campo 'archivo' contiene el nombre del archivo, no base64
    // Asumiendo que tienes una ruta base para los archivos
    if (archivo.archivo) {
      // Opción 1: Si tienes una URL base para descargar archivos
      const baseUrl = 'tu-url-base/archivos/'; // Ajusta según tu API
      window.open(baseUrl + archivo.archivo, '_blank');
      
      // Opción 2: Si necesitas hacer una petición HTTP para obtener el archivo
      // this.apiArchivos_municipio.downloadFile(archivo.id_archivo).subscribe({
      //   next: (blob) => {
      //     const url = window.URL.createObjectURL(blob);
      //     const link = document.createElement('a');
      //     link.href = url;
      //     link.download = archivo.nombre_archivo;
      //     link.click();
      //     window.URL.revokeObjectURL(url);
      //   },
      //   error: (err) => {
      //     console.error('Error al descargar:', err);
      //     this.messageService.add({
      //       severity: 'error',
      //       summary: 'Error',
      //       detail: 'No se pudo descargar el archivo'
      //     });
      //   }
      // });
    }
  }

  deleteSelectedArchivos() {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar ${this.selectedArchivos.length} archivo(s) seleccionado(s)?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        const idsToDelete = this.selectedArchivos.map(a => a.id_archivo);
        this.Archivos_municipio = this.Archivos_municipio.filter(a => !idsToDelete.includes(a.id_archivo));
        this.selectedArchivos = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminados',
          detail: 'Archivos eliminados correctamente'
        });
      }
    });
  }

  exportCSV(event: any) {
    // La tabla exportará automáticamente
    this.messageService.add({
      severity: 'success',
      summary: 'Exportando',
      detail: 'Generando archivo CSV...'
    });
  }

  clear(table: Table) {
    table.clear();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros Limpiados',
      detail: 'Se han eliminado todos los filtros'
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
    switch (tipo) {
      case 'PDF':
        return 'text-red-500';
      case 'Excel':
        return 'text-green-500';
      case 'Word':
        return 'text-blue-500';
      case 'Imagen':
        return 'text-purple-500';
      case 'ZIP':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }

  customSort(event: any) {
    event.data.sort((data1: any, data2: any) => {
      const value1 = data1[event.field];
      const value2 = data2[event.field];
      let result = null;

      if (value1 == null && value2 != null) {
        result = -1;
      } else if (value1 != null && value2 == null) {
        result = 1;
      } else if (value1 == null && value2 == null) {
        result = 0;
      } else if (typeof value1 === 'string' && typeof value2 === 'string') {
        result = value1.localeCompare(value2);
      } else {
        result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
      }

      return event.order * result;
    });
  }
}