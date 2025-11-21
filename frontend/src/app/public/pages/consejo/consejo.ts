import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiIntegrantesConsejo, IntegrantesConsejo } from '../../../core/services/consejo';

@Component({
  selector: 'app-consejo',
  imports: [ CommonModule],
  standalone: true,
  templateUrl: './consejo.html',
  styleUrl: './consejo.css',
})
export class Consejo implements OnInit {

  integrantes: IntegrantesConsejo[] = [];
  loading = true;
  error: string | null = null;

  constructor(private apiService: ApiIntegrantesConsejo) {}

  ngOnInit(): void {
    this.getIntegrantes();
  }

  getIntegrantes(): void {
    this.apiService.getIntegrantes().subscribe({
      next: (response) => {
        if (response.success) {
          // Filtrar por estatus "A" y ordenar por importancia
          this.integrantes = response.data
            .filter((integrante) => integrante.estatus === 'A')
            .sort((a, b) => a.importancia - b.importancia);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar integrantes:', err);
        this.error = 'Error al cargar los integrantes del consejo';
        this.loading = false;
      }
    });
  }
}