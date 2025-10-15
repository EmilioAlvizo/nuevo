//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit } from '@angular/core';
import { ApiTestimonios, Testimonios } from '../../../services/api';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  testimonios: Testimonios[] = [];

  constructor(private datasetService: ApiTestimonios) {}

  ngOnInit(): void {
    this.datasetService.getMessage().subscribe({
      next: (datos) => {
        console.log(datos.data);
        this.testimonios = datos.data;
      },
      error: (err) => console.error('Error fetching datasets:', err)
    });
  }
}
