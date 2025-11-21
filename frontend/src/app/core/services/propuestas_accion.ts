// nuevo/frontend/src/app/services/propuestas_accion.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Propuesta {
  id_propuesta: number;
  id_municipio: number;
  nombreMunicipio: string;
  nombreC: string;
  sexo: string;
  edad: number;
  actividad: string;
  correo: string;
  zona: string;
  detalle: string;
  justificacion: string;
  fecha_registro: string;
  necesidades: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiPropuesta {
  private apiUrl = `${environment.apiUrl}/propuestas`;
  private http = inject(HttpClient);

  getPropuestas(): Observable<ApiResponse<Propuesta>> {
    return this.http.get<ApiResponse<Propuesta>>(this.apiUrl);
  }

  crearPropuesta(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarPropuesta(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarPropuesta(id: number): Observable<ApiResponse<Propuesta>> {
    return this.http.delete<ApiResponse<Propuesta>>(`${this.apiUrl}/${id}`);
  }
}
