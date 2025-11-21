// nuevo/frontend/src/app/services/consejo.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IntegrantesConsejo {
  id_integrante: number;
  nombre: string;
  cargo: string;
  cargo_consejo: string;
  importancia: number;
  imagen: string;
  estatus: string;
  fecha_modificacion: string;
}

export interface ApiResponse {
  success: boolean;
  data: IntegrantesConsejo[];
}

@Injectable({
  providedIn: 'root',
})

export class ApiIntegrantesConsejo {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getIntegrantes():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/consejo`,{});
  }

  createIntegrante(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/consejo`, formData);
  }

  updateIntegrante(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/consejo/${id}`, formData);
  }

  deleteIntegrante(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/consejo/${id}`);
  }
   
}