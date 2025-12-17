// nuevo/frontend/src/app/services/temas_interes.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Temas {
  id_tema: number;
  descripcionTema: string;
  imagen: string;
  estatusTema: string;
  fecha_modificacionTema: string;
  link: string;
  descripcionMas: string;
}

@Injectable({
  providedIn: 'root',
})


//esto es para comunicarse con el backend real
export class ApiTemas {
  private apiUrl = `${environment.apiUrl}/temas`;
  private http = inject(HttpClient);

  getTemas():Observable<ApiResponse<Temas>> {
    return this.http.get<ApiResponse<Temas>>(this.apiUrl);
  }

  createTema(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateTema(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  deleteTema(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
 
}