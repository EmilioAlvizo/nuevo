// nuevo/frontend/src/app/services/temas_interes.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Temas {
  id_tema: number;
  descripcionTema: string;
  imagen: string;
  estatusTema: string;
  fecha_modificacionTema: string;
  link: string;
  descripcionMas: string;
}

export interface ApiResponse {
  success: boolean;
  data: Temas[];
}

@Injectable({
  providedIn: 'root',
})


//esto es para comunicarse con el backend real
export class ApiTemas {
    private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTemas():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/temas`,{});
  }

  createTema(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/temas`, formData);
  }

  updateTema(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/temas/${id}`, formData);
  }

  deleteTema(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/temas/${id}`);
  }
 
}