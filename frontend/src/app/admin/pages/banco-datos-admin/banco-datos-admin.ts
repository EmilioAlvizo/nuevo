import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TreeNode, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { BancoDatosService, BancoDatos, Categoria } from './../../../core/services/banco_datos';

import { TreeModule } from 'primeng/tree';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SafePipe } from '../../../core/pipes/safe.pipe';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { PlatformService } from '../../../core/services/platform.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-file-manager',
  templateUrl: './banco-datos-admin.html',
  styleUrls: ['./banco-datos-admin.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TreeModule,
    TableModule,
    DialogModule,
    ButtonModule,
    FileUploadModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SafePipe,
    SelectModule,
    DatePickerModule,
    TabsModule,
    ToastModule
  ],
  providers: [MessageService]
})

export class BancoDatosAdmin implements OnInit {
  
  protected platform = inject(PlatformService);
  private messageService = inject(MessageService);
  public archivoService = inject(BancoDatosService);

  // Signals locales
  vistaActiva = signal<number>(0);
  nodoSeleccionado = signal<TreeNode | null>(null);
  categoriaSeleccionada = signal<Categoria | null>(null);
  
  // Dialogs
  mostrarDialogSubida = signal<boolean>(false);
  mostrarDialogNuevaCarpeta = signal<boolean>(false);
  mostrarDialogVisualizador = signal<boolean>(false);
  mostrarDialogEdicion = signal<boolean>(false);
  
  // Archivo actual
  archivoSeleccionado = signal<File | null>(null);
  archivoParaVisualizar = signal<BancoDatos | null>(null);
  archivoParaEditar = signal<BancoDatos | null>(null);
  urlVisualizacion = signal<string>('');
  nombreNuevaCarpeta = signal<string>('');
  
  // Formularios
  formularioArchivo!: FormGroup;
  formularioEdicion!: FormGroup;

  // Computed signals
  categorias = computed<TreeNode[]>(() => 
    this.convertirATreeNode(this.archivoService.categorias())
  );

  archivosTabla = computed<BancoDatos[]>(() => 
    [...this.archivoService.archivos()]
  );

  constructor(private fb: FormBuilder) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    // Los datos ya se cargan automáticamente en el servicio
  }

  // ==================== INICIALIZACIÓN ====================
  private inicializarFormularios(): void {
    this.formularioArchivo = this.fb.group({
      nombre: ['', Validators.required],
      tema_designado: [''],
      atributo: [''],
      anio_informacion: [''],
      origen_institucion: [''],
      origen_documento: [''],
      grupo_edad: [''],
      nivel_informacion: [''],
      nombre_gestor: [''],
      fecha: [new Date()],
      link: [''],
      estatus: ['A']
    });

    this.formularioEdicion = this.fb.group({
      nombre: ['', Validators.required],
      tema_designado: [''],
      atributo: [''],
      anio_informacion: [''],
      origen_institucion: [''],
      origen_documento: [''],
      grupo_edad: [''],
      nivel_informacion: [''],
      nombre_gestor: [''],
      fecha: [''],
      link: [''],
      estatus: ['']
    });
  }

  // ==================== CONVERSIÓN ====================
  private convertirATreeNode(categorias: Categoria[]): TreeNode[] {
    return categorias.map(cat => ({
      label: cat.label,
      data: cat,
      icon: cat.icon,
      expandedIcon: cat.expandedIcon,
      collapsedIcon: cat.collapsedIcon,
      children: cat.children ? this.convertirATreeNode(cat.children) : []
    }));
  }

  // ==================== EVENTOS DE SELECCIÓN ====================
  onSeleccionNodo(event: any): void {
    this.nodoSeleccionado.set(event.node);
    if (event.node.data) {
      this.categoriaSeleccionada.set(event.node.data);
    }
  }

  onNodoClick(event: any): void {
    const nodo = event.node;
    if (nodo.data?.type === 'file' && nodo.data.fileId) {
      const archivo = this.archivoService.getArchivoPorId(nodo.data.fileId);
      if (archivo) {
        this.visualizarArchivo(archivo);
      }
    }
  }

  // ==================== GESTIÓN DE CARPETAS ====================
  abrirDialogNuevaCarpeta(): void {
    this.mostrarDialogNuevaCarpeta.set(true);
    this.nombreNuevaCarpeta.set('');
  }

  crearCarpeta(): void {
    const nombre = this.nombreNuevaCarpeta();
    if (nombre.trim()) {
      const categoria = this.categoriaSeleccionada();
      const parentId = categoria?.type === 'folder' ? categoria.id : undefined;
      
      this.archivoService.agregarCategoria(nombre, parentId);
      this.mostrarDialogNuevaCarpeta.set(false);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Carpeta Creada',
        detail: `La carpeta "${nombre}" se creó exitosamente`
      });
    }
  }

  eliminarCarpeta(): void {
    const categoria = this.categoriaSeleccionada();
    if (categoria?.type === 'folder') {
      if (confirm(`¿Estás seguro de eliminar la carpeta "${categoria.label}"?`)) {
        this.archivoService.eliminarCategoria(categoria.id);
        this.categoriaSeleccionada.set(null);
        this.nodoSeleccionado.set(null);
        
        this.messageService.add({
          severity: 'info',
          summary: 'Carpeta Eliminada',
          detail: 'La carpeta se eliminó correctamente'
        });
      }
    }
  }

  // ==================== GESTIÓN DE ARCHIVOS ====================
  abrirDialogSubida(): void {
    const categoria = this.categoriaSeleccionada();
    if (categoria?.type === 'folder') {
      this.mostrarDialogSubida.set(true);
      this.formularioArchivo.reset({
        fecha: new Date(),
        estatus: 'A'
      });
      this.archivoSeleccionado.set(null);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, selecciona una carpeta para subir el archivo'
      });
    }
  }

  onSeleccionArchivo(event: any): void {
    const file = event.files[0] as File;
    
    // Validar que sea Excel
    const validacion = this.archivoService.validarArchivoExcel(file);
    
    if (!validacion.valido) {
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo no válido',
        detail: validacion.mensaje
      });
      event.clear();
      this.archivoSeleccionado.set(null);
      return;
    }
    
    this.archivoSeleccionado.set(file);
  }

  async subirArchivo(): Promise<void> {
    const archivo = this.archivoSeleccionado();
    const categoria = this.categoriaSeleccionada();
    
    if (this.formularioArchivo.valid && archivo && categoria) {
      const formData = new FormData();
      
      // Agregar archivo
      formData.append('archivo', archivo);
      
      // Agregar campos del formulario
      Object.keys(this.formularioArchivo.value).forEach(key => {
        const valor = this.formularioArchivo.value[key];
        if (valor !== null && valor !== undefined) {
          if (valor instanceof Date) {
            formData.append(key, valor.toISOString().split('T')[0]);
          } else {
            formData.append(key, valor.toString());
          }
        }
      });
      
      // Agregar categoría (ruta completa de carpetas)
      formData.append('categoria', categoria.rutaCompleta || categoria.label);

      try {
        await this.archivoService.crearArchivo(formData);
        this.mostrarDialogSubida.set(false);
        this.archivoSeleccionado.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo Subido',
          detail: 'El archivo Excel se subió correctamente'
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al subir el archivo'
        });
      }
    }
  }

  editarArchivo(archivo: BancoDatos): void {
    this.archivoParaEditar.set(archivo);
    this.formularioEdicion.patchValue({
      nombre: archivo.nombre,
      tema_designado: archivo.tema_designado,
      atributo: archivo.atributo,
      anio_informacion: archivo.anio_informacion,
      origen_institucion: archivo.origen_institucion,
      origen_documento: archivo.origen_documento,
      grupo_edad: archivo.grupo_edad,
      nivel_informacion: archivo.nivel_informacion,
      nombre_gestor: archivo.nombre_gestor,
      fecha: archivo.fecha ? new Date(archivo.fecha) : null,
      link: archivo.link,
      estatus: archivo.estatus
    });
    this.mostrarDialogEdicion.set(true);
  }

  async guardarEdicion(): Promise<void> {
    const archivo = this.archivoParaEditar();
    
    if (this.formularioEdicion.valid && archivo && archivo.id_banco) {
      const formData = new FormData();
      
      Object.keys(this.formularioEdicion.value).forEach(key => {
        const valor = this.formularioEdicion.value[key];
        if (valor !== null && valor !== undefined) {
          if (valor instanceof Date) {
            formData.append(key, valor.toISOString().split('T')[0]);
          } else {
            formData.append(key, valor.toString());
          }
        }
      });

      try {
        await this.archivoService.actualizarArchivo(archivo.id_banco, formData);
        this.mostrarDialogEdicion.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo Actualizado',
          detail: 'El archivo se actualizó correctamente'
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al actualizar el archivo'
        });
      }
    }
  }

  async eliminarArchivo(archivo: BancoDatos): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar el archivo "${archivo.nombre}"?`)) {
      if (archivo.id_banco) {
        try {
          await this.archivoService.eliminarArchivo(archivo.id_banco);
          this.messageService.add({
            severity: 'success',
            summary: 'Archivo Eliminado',
            detail: 'El archivo se eliminó correctamente'
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el archivo'
          });
        }
      }
    }
  }

  // ==================== VISUALIZACIÓN ====================
  visualizarArchivo(archivo: BancoDatos): void {
    this.archivoParaVisualizar.set(archivo);
    
    if (archivo.archivo && archivo.id_banco) {
      this.urlVisualizacion.set(
        this.archivoService.obtenerUrlArchivo(archivo.id_banco, archivo.archivo)
      );
    }
    
    this.mostrarDialogVisualizador.set(true);
  }

  descargarArchivo(archivo: BancoDatos): void {
    if (archivo.archivo && archivo.id_banco) {
      const url = this.archivoService.obtenerUrlArchivo(archivo.id_banco, archivo.archivo);
      const link = document.createElement('a');
      link.href = url;
      link.download = archivo.nombre;
      link.target = '_blank';
      link.click();
    }
  }

  // ==================== UTILIDADES ====================
  getIconoClasificacion(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'Excel': 'pi pi-file-excel',
      'xlsx': 'pi pi-file-excel',
      'xls': 'pi pi-file-excel'
    };
    return iconos[tipo] || 'pi pi-file-excel';
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX');
  }

  recargarDatos(): void {
    this.archivoService.cargarArchivosDesdeBackend();
  }
}