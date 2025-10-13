import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../api';
import { CommonModule } from '@angular/common';

type SectionKey = 'policyAreas' | 'policyIssues' | 'policySubIssues';

interface GrupoExpandible {
  expandido: boolean;
}

@Component({
  selector: 'app-tabla',
  imports: [CommonModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class Tabla implements OnInit {
  municipios: Municipio[] = [];
  filteredMunicipios: Municipio[] = [];
  searchTerm: string = '';

  constructor(private datasetService: Api) {}

  ngOnInit(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.municipios = datos.data;
        this.filteredMunicipios = datos.data;
      },
      error: (err) => console.error('Error fetching datasets:', err)
    });
  }

  onSearch(term: string) {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredMunicipios = this.municipios.filter(m =>
      m.nombre.toLowerCase().includes(this.searchTerm)
    );
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
        break;
    }
  }
  
  // Ejemplo de filtros
  ordenarAscendente() {
    this.filteredMunicipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  
  ordenarDescendente() {
    this.filteredMunicipios.sort((a, b) => b.nombre.localeCompare(a.nombre));
  }
  
  ordenarPorFechaAscendente() {
    this.filteredMunicipios.sort((a, b) => new Date(a.Fecha_Captura).getTime() - new Date(b.Fecha_Captura).getTime());
  }
  
  ordenarPorFechaDescendente() {
    this.filteredMunicipios.sort((a, b) => new Date(b.Fecha_Captura).getTime() - new Date(a.Fecha_Captura).getTime());
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

}
