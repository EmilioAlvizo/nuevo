import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../shared/interface';

export interface Categoria_cendoc {
  id_categoria_cendoc: number;
  nombre_categoria_cendoc: string;
  estatus_categoria_cendoc: string;
  fecha_modificacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiCategoriaCendoc {
  private apiUrl = `${environment.apiUrl}/categorias_cendoc`;
  private http = inject(HttpClient);

  get(): Observable<ApiResponse<Categoria_cendoc>> {
    return this.http.get<ApiResponse<Categoria_cendoc>>(this.apiUrl);
  }
}
