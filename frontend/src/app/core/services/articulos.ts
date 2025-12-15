// nuevo/frontend/src/app/services/articulos.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

// Tipado de los artículos
export interface Articulos {
  id_articulo: number;
  id_revista: number;
  titulo: string;
  autor: string;
  contenido: string;
  pagina_revista: number;
  imagen: string;
  estatus: string;
  fecha_modificacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiArticulos {
  private apiUrl = `${environment.apiUrl}/articulos`;
  private http = inject(HttpClient);

  getValoresUnicos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/valores-unicos`);
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getFiltrados(filtros: any): Observable<ApiResponsePaginated<Articulos>> {
    let params = new HttpParams();

    // Agregar todos los parámetros dinámicamente
    Object.keys(filtros).forEach((key) => {
      const value = filtros[key];

      if (value !== null && value !== undefined) {
        // Si es un array, convertir a string separado por comas
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params = params.set(key, value.join(','));
          }
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<ApiResponsePaginated<Articulos>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  getArticulos(): Observable<ApiResponse<Articulos>> {
    return this.http.get<ApiResponse<Articulos>>(this.apiUrl);
  }

  crearArticulo(formData: FormData): Observable<any> {
    console.log('apiUrl: ', this.apiUrl);
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    return this.http.post(this.apiUrl, formData);
  }

  actualizarArticulo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }



  // crearArticulo(formData: FormData): Observable<ApiResponse> {
  //   return this.http.post<ApiResponse>(`${this.apiUrl}/articulos`, formData);
  // }

  // actualizarArticulo(id: number, data: Partial<Articulos>): Observable<ApiResponse> {
  //   return this.http.put<ApiResponse>(`${this.apiUrl}/articulos/${id}`, data);
  // }





}
