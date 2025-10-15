import { Component, OnInit } from '@angular/core';
import { Api, Municipio } from '../../../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [ CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  municipios: Municipio[] = [];
  
  constructor(private api: Api) {}

  ngOnInit(): void {
    this.cargarMunicipios();
  }

  cargarMunicipios(): void {
    this.api.getMessage().subscribe(
      response => {
        if(response.success) {
          this.municipios = response.data;
        } else {
          console.error('Error al obtener municipios');
        }
      },
      error => {
        console.error('Error en la llamada al backend', error);
      }
    );
  }
}
