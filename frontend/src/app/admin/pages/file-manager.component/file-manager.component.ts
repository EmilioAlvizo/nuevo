import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FileManagerService, FileMetadata, Categoria } from './../../../core/services/file';


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
import { TabList, TabsModule } from 'primeng/tabs';
import { TabPanel } from 'primeng/tabs';
import { PlatformService } from '../../../core/services/platform.service';


@Component({
  selector: 'app-file-manager.component',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.css'],
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

  ]
})
export class FileManagerComponent implements OnInit {

  protected platform = inject(PlatformService);

  // Vistas
  vistaActiva: string = '0';
  
  // Datos
  categorias: TreeNode[] = [];
  archivos: FileMetadata[] = [];
  archivosPorDependencia: any[] = [];
  archivosPorMunicipio: any[] = [];
  archivosPorRegion: any[] = [];
  archivosPorTipo: any[] = [];
  
  // Selección
  nodoSeleccionado: TreeNode | null = null;
  categoriaSeleccionada: Categoria | null = null;
  
  // Dialogs
  mostrarDialogSubida: boolean = false;
  mostrarDialogNuevaCarpeta: boolean = false;
  mostrarDialogVisualizador: boolean = false;
  
  // Formularios
  formularioArchivo!: FormGroup;
  nombreNuevaCarpeta: string = '';
  
  // Archivo actual
  archivoSeleccionado: File | null = null;
  archivoParaVisualizar: FileMetadata | null = null;
  urlVisualizacion: string = '';
  
  // Opciones
  tiposArchivo = ['PDF', 'Word', 'Excel', 'Imagen', 'Otro'];
  dependencias = ['Recursos Humanos', 'Finanzas', 'Operaciones', 'Legal', 'TI'];
  municipios = ['San Felipe', 'Guanajuato', 'Dolores Hidalgo', 'León', 'San Miguel de Allende'];
  regiones = ['Región Centro', 'Región Norte', 'Región Sur', 'Región Costa', 'Región Altos'];

  constructor(
    private fb: FormBuilder,
    private fileService: FileManagerService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarArchivos();
  }

  private inicializarFormulario(): void {
    this.formularioArchivo = this.fb.group({
      nombre: ['', Validators.required],
      palabrasClave: [''],
      autor: ['', Validators.required],
      dependencia: ['', Validators.required],
      municipio: ['', Validators.required],
      region: ['', Validators.required],
      pais: ['México', Validators.required],
      fecha: [new Date(), Validators.required],
      tipo: ['PDF', Validators.required]
    });
  }

  private cargarCategorias(): void {
    this.fileService.getCategorias().subscribe(cats => {
      this.categorias = this.convertirATreeNode(cats);
    });
  }

  private cargarArchivos(): void {
    this.fileService.getArchivos().subscribe(archivos => {
      this.archivos = archivos;
      this.actualizarVistasClasificadas();
    });
  }

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

  private actualizarVistasClasificadas(): void {
    this.archivosPorDependencia = this.convertirMapaAArray(
      this.fileService.getArchivosPorDependencia()
    );
    this.archivosPorMunicipio = this.convertirMapaAArray(
      this.fileService.getArchivosPorMunicipio()
    );
    this.archivosPorRegion = this.convertirMapaAArray(
      this.fileService.getArchivosPorRegion()
    );
    this.archivosPorTipo = this.convertirMapaAArray(
      this.fileService.getArchivosPorTipo()
    );
  }

  private convertirMapaAArray(mapa: Map<string, FileMetadata[]>): any[] {
    const resultado: any[] = [];
    mapa.forEach((archivos, clave) => {
      archivos.forEach(archivo => {
        resultado.push({ clasificacion: clave, ...archivo });
      });
    });
    return resultado;
  }

  onSeleccionNodo(event: any): void {
    this.nodoSeleccionado = event.node;
    if (event.node.data) {
      this.categoriaSeleccionada = event.node.data;
    }
  }

  abrirDialogSubida(): void {
    if (this.categoriaSeleccionada && this.categoriaSeleccionada.type === 'folder') {
      this.mostrarDialogSubida = true;
      this.formularioArchivo.reset({
        pais: 'México',
        fecha: new Date(),
        tipo: 'PDF'
      });
    } else {
      alert('Por favor, selecciona una carpeta para subir el archivo');
    }
  }

  abrirDialogNuevaCarpeta(): void {
    if (!this.categoriaSeleccionada || this.categoriaSeleccionada.type === 'folder') {
      this.mostrarDialogNuevaCarpeta = true;
      this.nombreNuevaCarpeta = '';
    }
  }

  onSeleccionArchivo(event: any): void {
    this.archivoSeleccionado = event.files[0];
  }

  subirArchivo(): void {
    if (this.formularioArchivo.valid && this.archivoSeleccionado && this.categoriaSeleccionada) {
      const palabrasClave = this.formularioArchivo.value.palabrasClave
        ? this.formularioArchivo.value.palabrasClave.split(',').map((p: string) => p.trim())
        : [];

      const nuevoArchivo: FileMetadata = {
        id: Date.now().toString(),
        nombre: this.formularioArchivo.value.nombre,
        palabrasClave,
        autor: this.formularioArchivo.value.autor,
        dependencia: this.formularioArchivo.value.dependencia,
        municipio: this.formularioArchivo.value.municipio,
        region: this.formularioArchivo.value.region,
        pais: this.formularioArchivo.value.pais,
        fecha: this.formularioArchivo.value.fecha,
        tipo: this.formularioArchivo.value.tipo,
        archivo: this.archivoSeleccionado,
        categoriaId: this.categoriaSeleccionada.id,
        url: URL.createObjectURL(this.archivoSeleccionado)
      };

      this.fileService.agregarArchivo(nuevoArchivo);
      this.mostrarDialogSubida = false;
      this.archivoSeleccionado = null;
    }
  }

  crearCarpeta(): void {
    if (this.nombreNuevaCarpeta.trim()) {
      const parentId = this.categoriaSeleccionada?.id;
      this.fileService.agregarCategoria(this.nombreNuevaCarpeta, parentId);
      this.mostrarDialogNuevaCarpeta = false;
    }
  }

  eliminarCarpeta(): void {
    if (this.categoriaSeleccionada && this.categoriaSeleccionada.type === 'folder') {
      if (confirm(`¿Estás seguro de eliminar la carpeta "${this.categoriaSeleccionada.label}"?`)) {
        this.fileService.eliminarCategoria(this.categoriaSeleccionada.id);
        this.categoriaSeleccionada = null;
        this.nodoSeleccionado = null;
      }
    }
  }

  visualizarArchivo(archivo: FileMetadata): void {
    this.archivoParaVisualizar = archivo;
    this.urlVisualizacion = archivo.url || '';
    this.mostrarDialogVisualizador = true;
  }

  descargarArchivo(archivo: FileMetadata): void {
    if (archivo.url) {
      const link = document.createElement('a');
      link.href = archivo.url;
      link.download = archivo.nombre;
      link.click();
    }
  }

  onNodoClick(event: any): void {
    const nodo = event.node;
    if (nodo.data?.type === 'file' && nodo.data.fileId) {
      const archivo = this.fileService.getArchivoPorId(nodo.data.fileId);
      if (archivo) {
        this.visualizarArchivo(archivo);
      }
    }
  }

  getIconoClasificacion(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'Recursos Humanos': 'pi pi-users',
      'Finanzas': 'pi pi-dollar',
      'Operaciones': 'pi pi-cog',
      'Legal': 'pi pi-book',
      'TI': 'pi pi-desktop',
      'PDF': 'pi pi-file-pdf',
      'Word': 'pi pi-file-word',
      'Excel': 'pi pi-file-excel',
      'Imagen': 'pi pi-image'
    };
    return iconos[tipo] || 'pi pi-folder';
  }
}