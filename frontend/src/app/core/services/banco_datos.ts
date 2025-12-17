import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BancoDatos {
  id_banco?: number;
  nombre: string;
  tema_designado?: string;
  atributo?: string;
  anio_informacion?: string;
  origen_institucion?: string;
  origen_documento?: string;
  grupo_edad?: string;
  nivel_informacion?: string;
  nombre_gestor?: string;
  fecha?: string;
  link?: string;
  archivo?: string;
  categoria?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  estatus?: string;
}

export interface Categoria {
  id: string;
  label: string;
  icon?: string;
  children?: Categoria[];
  parentId?: string;
  expandedIcon?: string;
  collapsedIcon?: string;
  type: 'folder' | 'file';
  fileId?: string;
  rutaCompleta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BancoDatosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/banco`;
  
  // Signals en lugar de BehaviorSubjects
  archivos = signal<BancoDatos[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal<boolean>(false);
  
  // Computed signal para archivos filtrados si lo necesitas
  archivosActivos = computed(() => 
    this.archivos().filter(a => a.estatus === 'A')
  );
  
  constructor() {
    this.inicializarCategorias();
    this.cargarArchivosDesdeBackend();
  }

  // ==================== CATEGORÍAS ====================
  private inicializarCategorias(): void {
    const categoriasIniciales: Categoria[] = [
      {
        id: '1',
        label: 'Documentos',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: [],
        rutaCompleta: 'Documentos'
      },
      {
        id: '2',
        label: 'Imágenes',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: [],
        rutaCompleta: 'Imágenes'
      },
      {
        id: '3',
        label: 'Reportes',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: [],
        rutaCompleta: 'Reportes'
      }
    ];
    this.categorias.set(categoriasIniciales);
  }

  agregarCategoria(nombre: string, parentId?: string): void {
    const categorias = [...this.categorias()];
    const parent = parentId ? this.encontrarCategoria(categorias, parentId) : null;
    
    const rutaCompleta = parent 
      ? `${parent.rutaCompleta}/${nombre}`
      : nombre;

    const nuevaCategoria: Categoria = {
      id: Date.now().toString(),
      label: nombre,
      icon: 'pi pi-folder',
      expandedIcon: 'pi pi-folder-open',
      collapsedIcon: 'pi pi-folder',
      type: 'folder',
      children: [],
      parentId,
      rutaCompleta
    };

    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(nuevaCategoria);
    } else {
      categorias.push(nuevaCategoria);
    }
    
    this.categorias.set(categorias);
  }

  eliminarCategoria(id: string): void {
    const categorias = [...this.categorias()];
    this.eliminarCategoriaRecursivo(categorias, id);
    this.categorias.set(categorias);
  }

  private eliminarCategoriaRecursivo(categorias: Categoria[], id: string): boolean {
    for (let i = 0; i < categorias.length; i++) {
      if (categorias[i].id === id) {
        categorias.splice(i, 1);
        return true;
      }
      if (categorias[i].children) {
        if (this.eliminarCategoriaRecursivo(categorias[i].children!, id)) {
          return true;
        }
      }
    }
    return false;
  }

  private encontrarCategoria(categorias: Categoria[], id: string): Categoria | null {
    for (const cat of categorias) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = this.encontrarCategoria(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // ==================== BACKEND CALLS ====================
  cargarArchivosDesdeBackend(): void {
    this.cargando.set(true);
    this.http.get<any>(`${this.baseUrl}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.archivos.set(response.data);
          this.reconstruirArbolConArchivos(response.data);
        }
        this.cargando.set(false);
      }),
      catchError(error => {
        console.error('Error al cargar archivos:', error);
        this.cargando.set(false);
        return of({ success: false, data: [] });
      })
    ).subscribe();
  }

  private reconstruirArbolConArchivos(archivos: BancoDatos[]): void {
    const categorias = [...this.categorias()];
    
    // Limpiar archivos existentes del árbol
    this.limpiarArchivosDelArbol(categorias);
    
    // Agregar archivos según su categoría
    archivos.forEach(archivo => {
      if (archivo.categoria) {
        this.agregarArchivoAlArbol(categorias, archivo);
      }
    });
    
    this.categorias.set(categorias);
  }

  private limpiarArchivosDelArbol(categorias: Categoria[]): void {
    categorias.forEach(cat => {
      if (cat.children) {
        cat.children = cat.children.filter(child => child.type === 'folder');
        this.limpiarArchivosDelArbol(cat.children);
      }
    });
  }

  private agregarArchivoAlArbol(categorias: Categoria[], archivo: BancoDatos): void {
    const rutaCategorias = archivo.categoria!.split('/');
    let categoriasActuales = categorias;
    
    // Buscar o crear la ruta de carpetas
    for (let i = 0; i < rutaCategorias.length; i++) {
      const nombreCat = rutaCategorias[i];
      let categoria = categoriasActuales.find(c => c.label === nombreCat && c.type === 'folder');
      
      if (!categoria) {
        // Crear carpeta si no existe
        const rutaCompleta = rutaCategorias.slice(0, i + 1).join('/');
        categoria = {
          id: `auto-${Date.now()}-${i}`,
          label: nombreCat,
          icon: 'pi pi-folder',
          expandedIcon: 'pi pi-folder-open',
          collapsedIcon: 'pi pi-folder',
          type: 'folder',
          children: [],
          rutaCompleta
        };
        categoriasActuales.push(categoria);
      }
      
      if (!categoria.children) categoria.children = [];
      categoriasActuales = categoria.children;
    }
    
    // Agregar archivo al final de la ruta
    const nodoArchivo: Categoria = {
      id: `file-${archivo.id_banco}`,
      label: archivo.nombre,
      icon: 'pi pi-file-excel',
      type: 'file',
      fileId: archivo.id_banco?.toString()
    };
    
    categoriasActuales.push(nodoArchivo);
  }

  crearArchivo(formData: FormData): Promise<any> {
    this.cargando.set(true);
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${this.baseUrl}`, formData).pipe(
        tap(response => {
          if (response.success) {
            this.cargarArchivosDesdeBackend();
          }
          this.cargando.set(false);
          resolve(response);
        }),
        catchError(error => {
          console.error('Error al crear archivo:', error);
          this.cargando.set(false);
          reject(error);
          return of(null);
        })
      ).subscribe();
    });
  }

  actualizarArchivo(id: number, formData: FormData): Promise<any> {
    this.cargando.set(true);
    return new Promise((resolve, reject) => {
      this.http.put<any>(`${this.baseUrl}/${id}`, formData).pipe(
        tap(response => {
          if (response.success) {
            this.cargarArchivosDesdeBackend();
          }
          this.cargando.set(false);
          resolve(response);
        }),
        catchError(error => {
          console.error('Error al actualizar archivo:', error);
          this.cargando.set(false);
          reject(error);
          return of(null);
        })
      ).subscribe();
    });
  }

  eliminarArchivo(id: number): Promise<any> {
    this.cargando.set(true);
    return new Promise((resolve, reject) => {
      this.http.delete<any>(`${this.baseUrl}/${id}`).pipe(
        tap(response => {
          if (response.success) {
            this.cargarArchivosDesdeBackend();
          }
          this.cargando.set(false);
          resolve(response);
        }),
        catchError(error => {
          console.error('Error al eliminar archivo:', error);
          this.cargando.set(false);
          reject(error);
          return of(null);
        })
      ).subscribe();
    });
  }

  getArchivoPorId(id: string): BancoDatos | undefined {
    return this.archivos().find(a => a.id_banco?.toString() === id);
  }

  obtenerUrlArchivo(idBanco: number, nombreArchivo: string): string {
    return `${environment.apiUrl}/public/banco_datos/${idBanco}/${nombreArchivo}`;
  }

  // ==================== VALIDACIÓN DE ARCHIVOS EXCEL ====================
  validarArchivoExcel(file: File): { valido: boolean; mensaje: string } {
    const extensionesPermitidas = ['.xlsx', '.xls'];
    const nombreArchivo = file.name.toLowerCase();
    const esExcel = extensionesPermitidas.some(ext => nombreArchivo.endsWith(ext));
    
    if (!esExcel) {
      return {
        valido: false,
        mensaje: 'Solo se permiten archivos de Excel (.xlsx, .xls)'
      };
    }
    
    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valido: false,
        mensaje: 'El archivo no debe superar los 10MB'
      };
    }
    
    return {
      valido: true,
      mensaje: 'Archivo válido'
    };
  }
}