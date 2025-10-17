import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contactanos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contactanos.html',
  styleUrl: './contactanos.css',
})
export class Contactanos implements OnInit {
  municipios: Municipio[] = [];

  constructor(
    private api: Api,
  ) {}

  ngOnInit(): void {
    this.cargarMunicipios();
  }

  cargarMunicipios(): void {
    this.api.getMessage().subscribe(
      response => {
        if (response.success) {
          this.municipios = response.data;
          // this.municipios.pop(); // Elimina el último elemento del array

        } else {
          console.error('Error al obtener municipios');
        }
      },
      error => {
        console.error('Error en la llamada al backend (municipios)', error);
      }
    );
  }
}