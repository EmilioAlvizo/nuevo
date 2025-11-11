// nuevo/frontend/src/app/services/temas_interes.ts

import { Injectable, inject } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
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
 
}