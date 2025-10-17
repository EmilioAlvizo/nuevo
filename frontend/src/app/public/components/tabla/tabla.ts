// nuevo/frontend/src/app/public/components/tabla/tabla.ts
import { Component, OnInit } from '@angular/core';
import { ApiArchivos_municipio, Archivos_municipio } from '../../../services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../services/municipios';
import { ApiDocumentos_cendoc, Documentos_cendoc } from '../../../services/documentos_cendoc';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

type SectionKey = 'policyAreas' | 'policyIssues' | 'policySubIssues';

interface GrupoExpandible {
  expandido: boolean;
}

interface MunicipioConContador {
  id_municipio: number;
  nombre: string;
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

  // Para el filtro de municipios
  municipiosConContador: MunicipioConContador[] = [];
  municipiosFiltrados: MunicipioConContador[] = [];
  terminoBusquedaMunicipio: string = '';
  municipiosSeleccionados: Set<number> = new Set();

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
    private archivos_municipioService: ApiArchivos_municipio
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

  // ✅ NUEVO - Carga archivos con filtros desde el backend
  cargarArchivosFiltrados(): void {
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
        console.log('Archivos cargados:', this.filteredArchivos_municipio.length);
      },
      error: (err) => {
        console.error('Error fetching archivos filtrados:', err);
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

  isMunicipioSeleccionado(idMunicipio: number): boolean {
    return this.municipiosSeleccionados.has(idMunicipio);
  }

  onSearch(term: string) {
    this.searchSubject.next(term.toLowerCase());
  }

  // ✅ AHORA SOLO LLAMA AL BACKEND
  applyFilters() {
    this.cargarArchivosFiltrados();
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
  gruposPolicyAreas: GrupoExpandible = { expandido: false };
  gruposPolicyIssues: GrupoExpandible = { expandido: true };
  gruposPolicySubIssues: GrupoExpandible = { expandido: true };

  alternarGrupo(grupo: string): void {
    switch (grupo) {
      case 'policyAreas':
        this.gruposPolicyAreas.expandido = !this.gruposPolicyAreas.expandido;
        break;
      case 'policyIssues':
        this.gruposPolicyIssues.expandido = !this.gruposPolicyIssues.expandido;
        break;
      case 'policySubIssues':
        this.gruposPolicySubIssues.expandido = !this.gruposPolicySubIssues.expandido;
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
  }

}
