// nuevo/frontend/src/app/core/services/directorios.ts

import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Directorios {
  id_directorio: number;
  descripcion: string;
  descripcionMas: string;
  fecha_modificacion: string;
  link: string;
  estatus: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  data: Directorios[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiDirectorios {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}

  //PETICIÓN GET
  getDirectorios():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/directorios`,{});
  }

  createDirectorio(formData: FormData) {
  return this.http.post<any>(`${this.apiUrl}/directorios`, formData);
  }

  updateDirectorio(id: number, data: any){
  return this.http.put<any>(`${this.apiUrl}/directorios/${id}`, data);
  }

  deleteDirectorio(id: number){
    return this.http.delete<any>(`${this.apiUrl}/directorios/${id}`);
  }
}