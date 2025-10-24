import { Component, OnInit } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../services/revistas';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Flipbook } from '../../components/flipbook/flipbook';

@Component({
  selector: 'app-revista-voces',
  standalone: true,
  imports: [CommonModule, Flipbook ],
  templateUrl: './revista-voces.html',
  styleUrl: './revista-voces.css'
})
export class RevistaVoces implements OnInit {

revistas: Revistas[] = [];

  constructor(private apiRevistas: ApiRevistas, private router: Router) {}

  ngOnInit(): void {
    this.cargarRevistas();
  }

  cargarRevistas(): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo las revistas activas
          this.revistas = response.data.filter(r => r.estatus === 'A');
        }
      },
      error: (error) => {
        console.error('Error al obtener revistas:', error);
      }
    });
  }

  abrirRevista(revista: Revistas): void {
    // Redirige a una vista detalle pasando el id de la revista
    this.router.navigate(['/revista', revista.id_revista]);
  }



}
