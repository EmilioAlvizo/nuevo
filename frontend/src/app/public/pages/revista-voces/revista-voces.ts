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
//   cards = [
//   {
//     title: 'Volumen 1',
//     articles: 5,
//     image: '/revistas/vol1.jpg',
//     layers: 5
//   },
//   {
//     title: 'Volumen 2',
//     articles: 3,
//     image: '/revistas/vol2.jpg',
//     layers: 3
//   },
//     {
//     title: 'Volumen 3',
//     articles: 4,
//     image: '/revistas/vol3.jpg',
//     layers: 4
//   },
//     {
//     title: 'Volumen 4',
//     articles: 2,
//     image: '/revistas/vol4.jpg',
//     layers: 2
//   },
// ];

revistas: Revistas[] = [];

  constructor(private apiRevistas: ApiRevistas, private router: Router) {}

  ngOnInit(): void {
    this.cargarRevistas();
  }
  
  // cargarRevistas(): void {
  //   this.apiRevistas.getMessage().subscribe(
  //     (response) => { 
  //       if (response.success) {
  //         this.revistas = response.data;
  //       }else {
  //         console.error('Error al cargar las revistas');
  //       }
  //     },
  //     (error) => {
  //       console.error('Error en la solicitud:', error);
  //     },
  //     );
  // }

    cargarRevistas(): void {
    this.apiRevistas.getMessage().subscribe({
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
