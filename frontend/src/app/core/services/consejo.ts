// nuevo/frontend/src/app/services/consejo.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

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

@Injectable({
  providedIn: 'root',
})

export class ApiIntegrantesConsejo {
  private apiUrl = `${environment.apiUrl}/consejo`;
  private http = inject(HttpClient);


  getIntegrantes():Observable<ApiResponse<IntegrantesConsejo>> {
    return this.http.get<ApiResponse<IntegrantesConsejo>>(this.apiUrl);
  }

  createIntegrante(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateIntegrante(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  deleteIntegrante(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
   
}