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
  getMessage():Observable<ApiResponse> {
    
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/revistas`,{});
  }




}