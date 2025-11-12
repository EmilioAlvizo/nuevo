// nuevo/frontend/src/app/services/documentos_cendoc.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Documentos_cendoc {
  id_documento: number;
  nombre_documento: string;
  autor_documento: string;
  descripcion_documento: string;
  fecha_documento: string;
  id_categoria_cendoc: number;
  archivo_documento: string;
  estatus_documento: string;
  fecha_modificacion: string;
  palabra_clave: string;
  // Datos del municipio (JOIN)
  nombre_categoria?: string;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiDocumentos_cendoc {
  //url del backend
  private apiUrl = `${environment.apiUrl}/documentos_cendoc`;
  private http = inject(HttpClient);

  getMessage(): Observable<ApiResponse<Documentos_cendoc>> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse<Documentos_cendoc>>(this.apiUrl);
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getFiltrados(filtros: any): Observable<ApiResponsePaginated<Documentos_cendoc>> {
    let params = new HttpParams();

    // Agregar todos los parámetros dinámicamente
    Object.keys(filtros).forEach((key) => {
      const value = filtros[key];

      if (value !== null && value !== undefined) {
        // Si es un array, convertir a string separado por comas
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params = params.set(key, value.join(','));
          }
        } else {
          params = params.set(key, value.toString());
        }
      }
    });
    console.log('Llamando a API DocumentoFisico con params:', params.toString());

    return this.http.get<ApiResponsePaginated<Documentos_cendoc>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  // Obtener conteo de archivos por municipio
  getConteosPorDocumentos_cendoc(): Observable<{
    success: boolean;
    data: { id_categoria_cendoc: number; nombre_categoria_cendoc: string; contador: number }[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/conteos-documentos_cendoc`);
  }

  crear(formData: FormData) {
    console.log('apiUrl: ', this.apiUrl);
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  actualizar(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<ApiResponse<Documentos_cendoc>> {
    return this.http.delete<ApiResponse<Documentos_cendoc>>(`${this.apiUrl}/${id}`);
  }
}
