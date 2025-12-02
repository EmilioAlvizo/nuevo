// nuevo/frontend/src/app/services/apoyos_servicios.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Apoyos {
  id_apoyo: number;
  nombre: string;
  imagen: string;
  estatus: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  link: string;
  descripcion: string;
}

export interface ApiResponse {
  success: boolean;
  data: Apoyos[];
}

@Injectable({
  providedIn: 'root',
})


//esto es para comunicarse con el backend real
export class ApiApoyos {
    private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getApoyos():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/apoyos`,{});
  }

  createApoyo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/apoyos`, formData);
  }

  updateApoyo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/apoyos/${id}`, formData);
  }

  deleteApoyo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/apoyos/${id}`);
  }
 
}