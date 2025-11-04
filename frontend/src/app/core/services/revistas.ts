// nuevo/frontend/src/app/services/revistas.ts

import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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
export interface ApiResponse {
  success: boolean;
  data: Revistas[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiRevistas {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}

  //PETICIÓN GET
  getRevistas():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/revistas`,{});
  }

  getFiltrados():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/revistas`,{});
  }

  crearRevista(formData: FormData) {
  return this.http.post<any>(`${this.apiUrl}/revistas`, formData);
  }

  actualizarRevista(id: number, data: any){
  return this.http.put<any>(`${this.apiUrl}/revistas/${id}`, data);
  }


  eliminarRevista(id: number){
    return this.http.delete<any>(`${this.apiUrl}/revistas/${id}`);
  }

}