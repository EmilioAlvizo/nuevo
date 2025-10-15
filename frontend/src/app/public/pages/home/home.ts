//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { ApiTestimonios, Testimonios } from '../../../services/api';
import { Api, Municipio } from '../../../services/api';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  testimonios: Testimonios[] = [];
  municipios: Municipio[] = [];

  constructor(private datasetService: ApiTestimonios, private municipioService: Api) {}

  ngOnInit(): void {
    //cargar testimonios
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        this.testimonios = datos.data;
      },
      error: (err) => console.error('Error fetching datasets:', err),
    });

    //cargar municipios
    this.municipioService.getMessage().subscribe({
      next: (datos) => {
        this.municipios = datos.data;
      },
      error: (err) => console.error('Error fetching municipios:', err),
    });
  }
}
