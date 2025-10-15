//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../../services/api';
import { ApiTestimonios, Testimonios } from '../../../services/api';
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

  constructor(
    private api: Api,
    private datasetService: ApiTestimonios
  ) {}

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarTestimonios();
  }

  cargarMunicipios(): void {
    this.api.getMessage().subscribe(
      response => {
        if (response.success) {
          this.municipios = response.data;
          this.municipios.pop(); // Elimina el último elemento del array

        } else {
          console.error('Error al obtener municipios');
        }
      },
      error => {
        console.error('Error en la llamada al backend (municipios)', error);
      }
    );
  }

  cargarTestimonios(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.testimonios = datos.data;
      },
      error: (err) => {
        console.error('Error al obtener testimonios', err);
      }
    });
  }

  // ngOnInit(): void {
  //   this.datasetService.getMessage().subscribe({
  //     next: (datos) => {
  //       console.log(datos.data);
  //       this.testimonios = datos.data;
  //     },
  //     error: (err) => console.error('Error fetching datasets:', err)
  //   });
  // }


}


