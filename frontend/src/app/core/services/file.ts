import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FileMetadata {
  id: string;
  nombre: string;
  palabrasClave: string[];
  autor: string;
  dependencia: string;
  municipio: string;
  region: string;
  pais: string;
  fecha: Date;
  tipo: 'PDF' | 'Word' | 'Excel' | 'Imagen' | 'Otro';
  archivo: File;
  categoriaId: string;
  url?: string;
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
}

@Injectable({
  providedIn: 'root'
})
export class FileManagerService {
  private archivos$ = new BehaviorSubject<FileMetadata[]>([]);
  private categorias$ = new BehaviorSubject<Categoria[]>([]);
  
  constructor() {
    this.inicializarCategorias();
  }

  private inicializarCategorias(): void {
    const categoriasIniciales: Categoria[] = [
      {
        id: '1',
        label: 'Documentos',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: []
      },
      {
        id: '2',
        label: 'Imágenes',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: []
      },
      {
        id: '3',
        label: 'Reportes',
        icon: 'pi pi-folder',
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        type: 'folder',
        children: []
      }
    ];
    this.categorias$.next(categoriasIniciales);
  }

  getArchivos(): Observable<FileMetadata[]> {
    return this.archivos$.asObservable();
  }

  getCategorias(): Observable<Categoria[]> {
    return this.categorias$.asObservable();
  }

  agregarArchivo(archivo: FileMetadata): void {
    const archivos = [...this.archivos$.value, archivo];
    this.archivos$.next(archivos);
    this.actualizarArbolCategorias(archivo);
  }

  private actualizarArbolCategorias(archivo: FileMetadata): void {
    const categorias = [...this.categorias$.value];
    const categoria = this.encontrarCategoria(categorias, archivo.categoriaId);
    
    if (categoria) {
      const nodoArchivo: Categoria = {
        id: `file-${archivo.id}`,
        label: archivo.nombre,
        icon: this.getIconoPorTipo(archivo.tipo),
        type: 'file',
        fileId: archivo.id
      };
      
      if (!categoria.children) {
        categoria.children = [];
      }
      categoria.children.push(nodoArchivo);
      this.categorias$.next(categorias);
    }
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

  agregarCategoria(nombre: string, parentId?: string): void {
    const nuevaCategoria: Categoria = {
      id: Date.now().toString(),
      label: nombre,
      icon: 'pi pi-folder',
      expandedIcon: 'pi pi-folder-open',
      collapsedIcon: 'pi pi-folder',
      type: 'folder',
      children: [],
      parentId
    };

    const categorias = [...this.categorias$.value];
    
    if (parentId) {
      const parent = this.encontrarCategoria(categorias, parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(nuevaCategoria);
      }
    } else {
      categorias.push(nuevaCategoria);
    }
    
    this.categorias$.next(categorias);
  }

  eliminarCategoria(id: string): void {
    const categorias = [...this.categorias$.value];
    this.eliminarCategoriaRecursivo(categorias, id);
    this.categorias$.next(categorias);
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

  getArchivoPorId(id: string): FileMetadata | undefined {
    return this.archivos$.value.find(a => a.id === id);
  }

  private getIconoPorTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'PDF': 'pi pi-file-pdf',
      'Word': 'pi pi-file-word',
      'Excel': 'pi pi-file-excel',
      'Imagen': 'pi pi-image',
      'Otro': 'pi pi-file'
    };
    return iconos[tipo] || 'pi pi-file';
  }

  getArchivosPorDependencia(): Map<string, FileMetadata[]> {
    return this.agruparPor('dependencia');
  }

  getArchivosPorMunicipio(): Map<string, FileMetadata[]> {
    return this.agruparPor('municipio');
  }

  getArchivosPorRegion(): Map<string, FileMetadata[]> {
    return this.agruparPor('region');
  }

  getArchivosPorTipo(): Map<string, FileMetadata[]> {
    return this.agruparPor('tipo');
  }

  private agruparPor(campo: keyof FileMetadata): Map<string, FileMetadata[]> {
    const mapa = new Map<string, FileMetadata[]>();
    this.archivos$.value.forEach(archivo => {
      const valor = String(archivo[campo]);
      if (!mapa.has(valor)) {
        mapa.set(valor, []);
      }
      mapa.get(valor)!.push(archivo);
    });
    return mapa;
  }
}