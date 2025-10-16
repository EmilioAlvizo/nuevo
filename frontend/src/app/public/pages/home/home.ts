//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { ApiMunicipio, Municipio } from '../../../services/municipios';
import { ApiTestimonios, Testimonios } from '../../../services/testimonios';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  municipios: Municipio[] = [];
  testimonios: Testimonios[] = [];

  constructor(private api: ApiMunicipio, private datasetService: ApiTestimonios) {}

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarTestimonios();
  }

  cargarMunicipios(): void {
    this.api.getMessage().subscribe({
      next: (response) => {
        if (response.success) {
          this.municipios = response.data;
          this.municipios.pop(); // Elimina el último elemento del array
        } else {
          console.error('Error al obtener municipios');
        }
      },
      error: (err) => {
        console.error('Error en la llamada al backend (municipios)', err);
      },
    });
  }

  cargarTestimonios(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.testimonios = datos.data;
      },
      error: (err) => {
        console.error('Error al obtener testimonios', err);
      },
    });
  }
}
