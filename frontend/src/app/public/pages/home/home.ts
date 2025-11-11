//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { ApiTestimonios, Testimonios } from '../../../core/services/testimonios';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { ApiTemas, Temas } from '../../../core/services/temas_interes';

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
  temas: Temas[] = [];
  publicUrl = environment.publicUrl;

  constructor(private api: ApiMunicipio, private datasetService: ApiTestimonios, private apiTemas: ApiTemas) {}

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarTestimonios();
    this.cargarTemas();
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

    cargarTemas(): void {
    this.apiTemas.getTemas().subscribe({
      next: (datos) => {
        this.temas = datos.data;
      },
      error: (err) => {
        console.error('Error al obtener temas', err);
      },
    });
  }

  
}
