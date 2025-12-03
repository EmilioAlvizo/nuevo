// nuevo/frontend/src/app/services/articulos.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Tipado de los artículos
export interface Articulos {
  id_articulo: number;
  id_revista: number;
  titulo: string;
  autor: string;
  contenido: string;
  pagina: number;
  imagen: string;
  estatus: string;
  fecha_modificacion: string;
}

// Respuesta genérica de la API
export interface ApiResponse {
  success: boolean;
  data: Articulos[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiArticulos {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getArticulos():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/articulos`,{});
  }

  crearArticulo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/articulos`, formData);
  }

  actualizarArticulo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/articulos/${id}`, formData);
  }



  // crearArticulo(formData: FormData): Observable<ApiResponse> {
  //   return this.http.post<ApiResponse>(`${this.apiUrl}/articulos`, formData);
  // }

  // actualizarArticulo(id: number, data: Partial<Articulos>): Observable<ApiResponse> {
  //   return this.http.put<ApiResponse>(`${this.apiUrl}/articulos/${id}`, data);
  // }





}
