// nuevo/frontend/src/app/services/encuestas.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Encuesta {
  idEncuesta: number;
  pregunta: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  fechaModificacion: string;
  activa: boolean;
}

export interface EncuestaOpcion {
  idOpcion: number;
  idEncuesta: number;
  textoOpcion: string;
  votos: number;
}

export interface EncuestaConOpciones extends Encuesta {
  opciones: EncuestaOpcion[];
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiEncuestas {
  //url del backend
  private apiUrl = `${environment.apiUrl}/encuestas`;
  private http = inject(HttpClient);

  // Obtener encuestas
  getFiltrados(): Observable<ApiResponse<Encuesta>> {
    return this.http.get<ApiResponse<Encuesta>>(this.apiUrl);
  }

  getPorId(id: number): Observable<EncuestaConOpciones> {
    return this.http.get<EncuestaConOpciones>(`${this.apiUrl}/${id}`);
  }

  getEncuestaActiva(): Observable<EncuestaConOpciones> {
    return this.http.get<EncuestaConOpciones>(`${this.apiUrl}/activa`);
  }

  crear(data: any) {
    console.log("Servicio crear encuesta ",data);
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizar(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  votar(idEncuesta: number, idOpcion: number, huella: string) {
    return this.http.post(`${this.apiUrl}/${idEncuesta}/votar/${idOpcion}`, {
      huella,
    });
  }
}

