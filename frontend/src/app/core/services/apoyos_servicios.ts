// nuevo/frontend/src/app/services/apoyos_servicios.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Apoyos {
  id_apoyo: number;
  nombre: string;
  imagen: string;
  estatus: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  link: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})


//esto es para comunicarse con el backend real
export class ApiApoyos {
  private apiUrl = `${environment.apiUrl}/apoyos`;
  private http = inject(HttpClient);

  getApoyos():Observable<ApiResponse<Apoyos>> {
    return this.http.get<ApiResponse<Apoyos>>(this.apiUrl);
  }

  createApoyo(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateApoyo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  deleteApoyo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
 
}