// nuevo/frontend/src/app/public/components/tabla/tabla.ts
import { Component, OnInit } from '@angular/core';
import { ApiArchivos_municipio, Archivos_municipio } from '../../../services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../services/municipios';
import { ApiDocumentos_cendoc, Documentos_cendoc } from '../../../services/documentos_cendoc';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

interface GrupoExpandible {
  expandido: boolean;
}

interface MunicipioConContador {
  id_municipio: number;
  nombre: string;
  contador: number;
}

interface Documentos_cendocConContador {
  id_categoria_cendoc: number;
  nombre_categoria_cendoc: string;
  contador: number;
}

@Component({
  selector: 'app-tabla',
  imports: [CommonModule, FormsModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class Tabla implements OnInit {
  // Datos originales (solo para referencia)
  municipios: Municipio[] = [];
  
  // Datos filtrados que se muestran
  filteredArchivos_municipio: Archivos_municipio[] = [];
  filteredDocumentos_cendoc: Documentos_cendoc[] = [];

  // Para el filtro de municipios
  municipiosConContador: MunicipioConContador[] = [];
  municipiosFiltrados: MunicipioConContador[] = [];
  terminoBusquedaMunicipio: string = '';
  municipiosSeleccionados: Set<number> = new Set();

  // para el filtro de documentos cendoc
  documentosCendocConContador: Documentos_cendocConContador[] = [];
  documentosCendocFiltrados: Documentos_cendocConContador[] = [];
  terminoBusquedaDocumentoCendoc: string = '';
  documentosCendocSeleccionados: Set<number> = new Set();

  // Para búsqueda general
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  // Para ordenamiento
  ordenActual: string = '';

  // Paginación
  paginaActual: number = 1;
  totalResultados: number = 0;
  totalPaginas: number = 0;
  limite: number = 50;

  // Estado de carga
  cargando: boolean = false;

  constructor(
    private datasetService: ApiMunicipio, 
    private archivos_municipioService: ApiArchivos_municipio,
    private documentos_cendocService: ApiDocumentos_cendoc
  ) {
    // Debounce para la búsqueda (espera 500ms después de que el usuario deje de escribir)
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarConteosMunicipios();
    this.cargarArchivosFiltrados(); // Carga inicial
    this.cargarConteosDocumentosCendoc();
    this.cargarDocumentosCendocFiltrados(); // Carga inicial
  }

  cargarMunicipios(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.municipios = datos.data;
      },
      error: (err) => console.error('Error fetching municipios:', err)
    });
  }

  // ✅ NUEVO - Carga los conteos desde el backend
  cargarConteosMunicipios(): void {
    this.archivos_municipioService.getConteosPorMunicipio().subscribe({
      next: (response) => {
        this.municipiosConContador = response.data;
        this.municipiosFiltrados = [...this.municipiosConContador];
      },
      error: (err) => console.error('Error fetching conteos:', err)
    });
  }

  cargarConteosDocumentosCendoc(): void {
    this.documentos_cendocService.getConteosPorDocumentos_cendoc().subscribe({
      next: (response) => {
        this.documentosCendocConContador = response.data;
        this.documentosCendocFiltrados = [...this.documentosCendocConContador];
      },
      error: (err) => console.error('Error fetching conteos documentos cendoc:', err)
    });
  }

  // ✅ NUEVO - Carga archivos con filtros desde el backend
  cargarArchivosFiltrados(): void {
    console.log('Cargando ', this.documentosCendocSeleccionados);

    this.cargando = true;

    const params = {
      municipios: Array.from(this.municipiosSeleccionados),
      busqueda: this.searchTerm || undefined,
      ordenar: this.ordenActual || undefined,
      limite: this.limite,
      pagina: this.paginaActual
    };

    this.archivos_municipioService.getArchivosFiltrados(params).subscribe({
      next: (response) => {
        this.filteredArchivos_municipio = response.data;
        this.totalResultados = response.total || 0;
        this.totalPaginas = response.totalPaginas || 0;
        this.cargando = false;
        console.log('params muni', params);
        console.log('Archivos cargados:', this.filteredArchivos_municipio.length);
      },
      error: (err) => {
        console.error('Error fetching archivos filtrados:', err);
        this.cargando = false;
      }
    });
  }

  cargarDocumentosCendocFiltrados(): void {
    this.cargando = true;

    const params = {
      categoria: Array.from(this.documentosCendocSeleccionados),
      busqueda: this.searchTerm || undefined,
      ordenar: this.ordenActual || undefined,
      limite: this.limite,
      pagina: this.paginaActual
    };

    this.documentos_cendocService.getArchivosFiltrados(params).subscribe({
      next: (response) => {
        this.filteredDocumentos_cendoc = response.data;
        this.totalResultados = response.total || 0;
        this.totalPaginas = response.totalPaginas || 0;
        this.cargando = false;
        console.log('params doc', params);
        console.log('Documentos Cendoc cargados:', this.filteredDocumentos_cendoc.length);
      },
      error: (err) => {
        console.error('Error fetching documentos cendoc filtrados:', err);
        this.cargando = false;
      }
    });
  }

  buscarMunicipio(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusquedaMunicipio = input.value.toLowerCase();
    
    if (this.terminoBusquedaMunicipio === '') {
      this.municipiosFiltrados = [...this.municipiosConContador];
    } else {
      this.municipiosFiltrados = this.municipiosConContador.filter(m =>
        m.nombre.toLowerCase().includes(this.terminoBusquedaMunicipio)
      );
    }
  }

  buscarCategoriasDocumentoCendoc(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusquedaDocumentoCendoc = input.value.toLowerCase();

    if (this.terminoBusquedaDocumentoCendoc === '') {
      this.documentosCendocFiltrados = [...this.documentosCendocConContador];
    } else {
      this.documentosCendocFiltrados = this.documentosCendocConContador.filter(d =>
        d.nombre_categoria_cendoc.toString().toLowerCase().includes(this.terminoBusquedaDocumentoCendoc)
      );
    }
  }

  toggleMunicipio(idMunicipio: number): void {
    console.log('Toggle municipio:', idMunicipio);
    
    if (this.municipiosSeleccionados.has(idMunicipio)) {
      this.municipiosSeleccionados.delete(idMunicipio);
    } else {
      this.municipiosSeleccionados.add(idMunicipio);
    }
    
    console.log('Municipios seleccionados:', Array.from(this.municipiosSeleccionados));
    this.paginaActual = 1; // Resetear a la primera página
    this.applyFilters();
  }

  toggleDocumento_cendoc(idCategoria: number): void {
    console.log('Toggle categoria documento cendoc:', idCategoria);

    if (this.documentosCendocSeleccionados.has(idCategoria)) {
      this.documentosCendocSeleccionados.delete(idCategoria);
    } else {
      this.documentosCendocSeleccionados.add(idCategoria);
    } 

    console.log('Categorias documento cendoc seleccionadas:', Array.from(this.documentosCendocSeleccionados));
    this.paginaActual = 1;
    this.applyFilters();
  }

  isMunicipioSeleccionado(idMunicipio: number): boolean {
    return this.municipiosSeleccionados.has(idMunicipio);
  }

  isDocumento_cendocSeleccionado(idCategoria: number): boolean {
    return this.documentosCendocSeleccionados.has(idCategoria)
  }

  onSearch(term: string) {
    this.searchSubject.next(term.toLowerCase());
  }

  // ✅ AHORA SOLO LLAMA AL BACKEND
  applyFilters() {
    this.cargarArchivosFiltrados();
    this.cargarDocumentosCendocFiltrados();
  }

  // Ordenamiento
  ordenar(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.ordenActual = valor;
    this.paginaActual = 1; // Resetear a la primera página
    this.applyFilters();
  }

  formatDate(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString();
  }

  // Paginación
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.applyFilters();
    }
  }

  // Modos de vista
  viewMode: 'list' | 'grid' = 'list';

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  // Estado de expansión de grupos
  filtroPorCategoria: GrupoExpandible = { expandido: false };
  filtroPorMunicipio: GrupoExpandible = { expandido: false };
  filtroPorNombre: GrupoExpandible = { expandido: true };

  alternarGrupo(grupo: string): void {
    switch (grupo) {
      case 'porCategoria':
        this.filtroPorCategoria.expandido = !this.filtroPorCategoria.expandido;
        break;
      case 'porMunicipio':
        this.filtroPorMunicipio.expandido = !this.filtroPorMunicipio.expandido;
        break;
      case 'porNombre':
        this.filtroPorNombre.expandido = !this.filtroPorNombre.expandido;
        break;
    }
  }

  // Obtener nombre del municipio por ID
  obtenerNombreMunicipio(idMunicipio: number): string {
    const municipio = this.municipios.find(m => m.id_municipio === idMunicipio);
    return municipio ? municipio.nombre : 'Desconocido';
  }
  

  // Limpiar todos los filtros
  limpiarFiltros(): void {
    console.log('Limpiando filtros...');
    this.municipiosSeleccionados.clear();
    this.terminoBusquedaMunicipio = '';
    this.searchTerm = '';
    this.ordenActual = '';
    this.paginaActual = 1;
    this.municipiosFiltrados = [...this.municipiosConContador];
    this.applyFilters();

    this.documentosCendocSeleccionados.clear();
    this.terminoBusquedaDocumentoCendoc = '';
    this.searchTerm = '';
    this.ordenActual = '';
    this.paginaActual = 1;
    this.documentosCendocFiltrados = [...this.documentosCendocConContador];
    this.applyFilters();
  }

}
