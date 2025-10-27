// nuevo/frontend/src/app/services/municipios.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Municipio {
  id_municipio: number;
  nombre: string;
  Fecha_Captura: string;
  pdf: string;
}

export interface ApiResponse {
  success: boolean;
  data: Municipio[];
}

@Injectable({
  providedIn: 'root',
})

export class ApiMunicipio {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    
    return this.http.get<ApiResponse>(`${this.apiUrl}/municipios`,{});
  }
}