// nuevo/frontend/src/app/services/testimonios.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Testimonios {
  id_testimonios: number;
  id_municipio: number;
  nombreM: string;
  nombreMunicipio: string;
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

  getTestimonios():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/testimonios`,{});
  }

  createTestimonio(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/testimonios`, formData);
  }

  updateTestimonio(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/testimonios/${id}`, formData);
  }

  deleteTestimonio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/testimonios/${id}`);
  }
   
}