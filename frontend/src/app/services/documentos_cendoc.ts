// nuevo/frontend/src/app/services/archivos_municipio.ts

import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Archivos_municipio {
  id_archivo: number;
  nombre_archivo: string;
  fecha_archivo: string;
  id_municipio: number;
  archivo: string;
  estatus_archivo: string;
  fecha_modificacion: string;
  tipo_archivo: string;
  categoria_archivo: string;
  palabras_clave: string;
  subcategoria_archivo: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  data: Archivos_municipio[];
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiArchivos_municipio {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/archivos_municipio`,{});
  }
}