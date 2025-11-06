// nuevo/frontend/src/app/services/revistas.ts

import { Injectable, inject } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Revistas {
  id_revista: number;
  volumen: number;
  descripcion: string;
  numero_year: number;
  fecha: string;
  archivo: string;
  portada: string;
  estatus: string;
  fecha_modificacion: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}

export interface ApiResponsePaginated<T> {
  success: boolean;
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiRevistas {
  //url del backend
  private apiUrl = `${environment.apiUrl}/revistas`;
  private http = inject(HttpClient);

  //PETICIÓN GET
  getRevistas(): Observable<ApiResponse<Revistas>> {
    return this.http.get<ApiResponse<Revistas>>(this.apiUrl);
  }

  getFiltrados2(): Observable<ApiResponse<Revistas>> {
    return this.http.get<ApiResponse<Revistas>>(this.apiUrl);
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getFiltrados(
    filtros: any
  ): Observable<ApiResponse<Revistas>> {
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
    console.log('Llamando a API REVISTAS con params:', params.toString());

    return this.http.get<ApiResponsePaginated<Revistas>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  crearRevista(formData: FormData) {
    console.log('apiUrl: ', this.apiUrl);
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  actualizarRevista(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarRevista(id: number): Observable<ApiResponse<Revistas>> {
    return this.http.delete<ApiResponse<Revistas>>(`${this.apiUrl}/${id}`);
  }
}
