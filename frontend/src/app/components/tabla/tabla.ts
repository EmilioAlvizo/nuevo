import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../api';
import { CommonModule } from '@angular/common';

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
      next: (data) => {
        this.municipios = data;
        this.filteredMunicipios = data;
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
}
