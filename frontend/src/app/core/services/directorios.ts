// nuevo/frontend/src/app/core/services/directorios.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Directorios {
  id_directorio: number;
  descripcion: string;
  descripcionMas: string;
  fecha_modificacion: string;
  link: string;
  estatus: string;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiDirectorios {
  private apiUrl = `${environment.apiUrl}/directorios`;
  private http = inject(HttpClient);

  //PETICIÓN GET
  getDirectorios():Observable<ApiResponse<Directorios>> {
    return this.http.get<ApiResponse<Directorios>>(this.apiUrl);
  }

  createDirectorio(formData: FormData) {
  return this.http.post<any>(this.apiUrl, formData);
  }

  updateDirectorio(id: number, data: any){
  return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteDirectorio(id: number){
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}