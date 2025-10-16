import { Component, OnInit } from '@angular/core';
import { ApiArchivos_municipio, Archivos_municipio } from '../../../services/archivos_municipio';
import { ApiMunicipio, Municipio } from '../../../services/municipios';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type SectionKey = 'policyAreas' | 'policyIssues' | 'policySubIssues';

interface GrupoExpandible {
  expandido: boolean;
}

interface MunicipioConContador extends Municipio {
  contador: number;
}

@Component({
  selector: 'app-tabla',
  imports: [CommonModule, FormsModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class Tabla implements OnInit {
  municipios: Municipio[] = [];
  filteredMunicipios: Municipio[] = [];
  searchTerm: string = '';
  archivos_municipio: Archivos_municipio[] = [];
  filteredArchivos_municipio: Archivos_municipio[] = [];

  // Para el filtro de municipios
  municipiosConContador: MunicipioConContador[] = [];
  municipiosFiltrados: MunicipioConContador[] = [];
  terminoBusquedaMunicipio: string = '';
  municipiosSeleccionados: Set<number> = new Set();

  constructor(private datasetService: ApiMunicipio, private archivos_municipioService: ApiArchivos_municipio) {}

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarArchivos_municipio();
  }

  cargarMunicipios(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.municipios = datos.data;
        this.filteredMunicipios = datos.data;
        this.calcularContadorMunicipios();
      },
      error: (err) => console.error('Error fetching datasets:', err)
    });
  }

  cargarArchivos_municipio(): void {
    this.archivos_municipioService.getMessage().subscribe({
      next: (datos) => {
        this.archivos_municipio = datos.data;
        this.filteredArchivos_municipio = datos.data;
        this.calcularContadorMunicipios();
      },
      error: (err) => console.error('Error fetching datasets:', err)
    });
  }

  calcularContadorMunicipios(): void {
    if (this.municipios.length > 0 && this.archivos_municipio.length > 0) {
      this.municipiosConContador = this.municipios.map(m => {
        const contador = this.archivos_municipio.filter(a => a.id_municipio === m.id_municipio).length;
        return { ...m, contador };
      });
      this.municipiosFiltrados = [...this.municipiosConContador];
    }
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
    if (this.municipiosSeleccionados.has(idMunicipio)) {
      this.municipiosSeleccionados.delete(idMunicipio);
    } else {
      this.municipiosSeleccionados.add(idMunicipio);
    }
    this.applyFilters();
  }

  isMunicipioSeleccionado(idMunicipio: number): boolean {
    return this.municipiosSeleccionados.has(idMunicipio);
  }

  onSearch(term: string) {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    console.log('Aplicando filtros...');
    console.log('Municipios seleccionados:', Array.from(this.municipiosSeleccionados));
    console.log('Término de búsqueda:', this.searchTerm);

    // Empezar con todos los archivos
    let archivosFiltrados = [...this.archivos_municipio];

    // Filtrar por búsqueda general (nombre del archivo)
    if (this.searchTerm) {
      archivosFiltrados = archivosFiltrados.filter(a =>
        a.nombre_archivo.toLowerCase().includes(this.searchTerm)
      );
    }

    // Filtrar por municipios seleccionados (ESTE ES EL FILTRO PRINCIPAL)
    if (this.municipiosSeleccionados.size > 0) {
      archivosFiltrados = archivosFiltrados.filter(a => {
        const pertenece = this.municipiosSeleccionados.has(a.id_municipio);
        return pertenece;
      });
    }

    this.filteredArchivos_municipio = archivosFiltrados;

    // Filtrar municipios (para la vista de municipios si la usas)
    let municipiosFiltrados = [...this.municipios];

    if (this.searchTerm) {
      municipiosFiltrados = municipiosFiltrados.filter(m =>
        m.nombre.toLowerCase().includes(this.searchTerm)
      );
    }

    if (this.municipiosSeleccionados.size > 0) {
      municipiosFiltrados = municipiosFiltrados.filter(m =>
        this.municipiosSeleccionados.has(m.id_municipio)
      );
    }

    this.filteredMunicipios = municipiosFiltrados;
    
    console.log('Archivos filtrados:', this.filteredArchivos_municipio.length);
    console.log('Municipios filtrados:', this.filteredMunicipios.length);
  

    /*this.filteredMunicipios = this.municipios.filter(m =>
      m.nombre.toLowerCase().includes(this.searchTerm)
    );
    this.filteredArchivos_municipio = this.archivos_municipio.filter(a =>
      a.nombre_archivo.toLowerCase().includes(this.searchTerm)
    );*/
    console.log('Filtered Municipios:', this.filteredMunicipios.length);
  }

  //esto es para ordenar
  ordenar(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
  
    switch (valor) {
      case 'AZ':
        this.ordenarAscendente();
        break;
      case 'ZA':
        this.ordenarDescendente();
        break;
      case 'masReciente':
        this.ordenarPorFechaDescendente();
        break;
      case 'masAntiguo':
        this.ordenarPorFechaAscendente();
        break;
      default:
        this.filteredMunicipios;
        this.filteredArchivos_municipio;
        break;
    }
  }
  
  // Ejemplo de filtros
  ordenarAscendente() {
    this.filteredMunicipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.filteredArchivos_municipio.sort((a, b) => a.nombre_archivo.localeCompare(b.nombre_archivo));
  }
  
  ordenarDescendente() {
    this.filteredMunicipios.sort((a, b) => b.nombre.localeCompare(a.nombre));
    this.filteredArchivos_municipio.sort((a, b) => b.nombre_archivo.localeCompare(a.nombre_archivo));
  }
  
  ordenarPorFechaAscendente() {
    this.filteredMunicipios.sort((a, b) => new Date(a.Fecha_Captura).getTime() - new Date(b.Fecha_Captura).getTime());
    this.filteredArchivos_municipio.sort((a, b) => new Date(a.fecha_archivo).getTime() - new Date(b.fecha_archivo).getTime());  
  }
  
  ordenarPorFechaDescendente() {
    this.filteredMunicipios.sort((a, b) => new Date(b.Fecha_Captura).getTime() - new Date(a.Fecha_Captura).getTime());
    this.filteredArchivos_municipio.sort((a, b) => new Date(b.fecha_archivo).getTime() - new Date(a.fecha_archivo).getTime());
  }

  formatDate(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString();
  }

  //la parte de los filtros
  isOpen = {
    policyAreas: true,
    policyIssues: false,
    policySubIssues: true
  };
  
  policyAreas = [
    { name: 'Economy', count: 290 },
    { name: 'Taxation', count: 194 },
    { name: 'Regional, rural and urban development', count: 176 },
    { name: 'Education and skills', count: 108 },
    { name: 'Health', count: 85 },
    { name: 'Trade', count: 81 }
  ];
  
  toggleSection(section: SectionKey) {
    this.isOpen[section] = !this.isOpen[section];
  }
  
  //los modos de vista
  viewMode: 'list' | 'grid' = 'list';

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
    console.log('View mode changed to:', mode);
    // Aquí puedes emitir un evento o actualizar un servicio si necesitas
    // comunicar el cambio a otros componentes
  }

  //
  //
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
    this.municipiosFiltrados = [...this.municipiosConContador];
    this.applyFilters();
  }

}
