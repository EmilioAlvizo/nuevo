// nuevo/frontend/src/app/core/services/municipios.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../shared/interface';

export interface Municipio {
  id_municipio: number;
  nombre: string;
  Fecha_Captura: string;
  pdf: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiMunicipio {
  private apiUrl = `${environment.apiUrl}/municipios`;
  private http = inject(HttpClient);

  getMessage(): Observable<ApiResponse<Municipio>> {
    return this.http.get<ApiResponse<Municipio>>(this.apiUrl);
  }
}
