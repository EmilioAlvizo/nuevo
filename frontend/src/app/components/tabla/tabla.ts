import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../api';
import { CommonModule } from '@angular/common';

type SectionKey = 'policyAreas' | 'policyIssues' | 'policySubIssues';

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
  
}
