// nuevo/frontend/src/app/services/testimonios.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Testimonios {
  id_testimonios: number;
  id_municipio: number;
  nombreMunicipio: string;
  nombreM: string;
  descripcion: string;
  fecha_modificacion: string;
  imagenT: string;
  estatus: string
  correo: string;
  telefono: number;
}

export interface ApiResponse {
  success: boolean;
  data: Testimonios[];
}

@Injectable({
  providedIn: 'root',
})

export class ApiTestimonios {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    
    return this.http.get<ApiResponse>(`${this.apiUrl}/testimonios`,{});
  }
}