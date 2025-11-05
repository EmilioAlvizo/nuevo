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

  getFiltrados(): Observable<ApiResponse<Revistas>> {
    return this.http.get<ApiResponse<Revistas>>(this.apiUrl);
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
