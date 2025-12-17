import { Injectable, inject } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface DocumentoFisico {
  id_documento: number;
  titulo: string;
  editorial: string;
  tipo: string;
  clave: string;
  ejemplares: string;
  estatus: string;
  fecha_modificacion: string;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiDocumentosFisicos {
  //url del backend
  private apiUrl = `${environment.apiUrl}/documentos_fisicos`;
  private http = inject(HttpClient);

  //PETICIÓN GET
  getAll(): Observable<ApiResponse<DocumentoFisico>> {
    return this.http.get<ApiResponse<DocumentoFisico>>(this.apiUrl);
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getFiltrados(
    filtros: any
  ): Observable<ApiResponse<DocumentoFisico>> {
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
    //console.log('Llamando a API DocumentoFisico con params:', params.toString());

    return this.http.get<ApiResponsePaginated<DocumentoFisico>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  crear(formData: FormData) {
    //console.log('apiUrl: ', this.apiUrl);
    for (let pair of formData.entries()) {
      //console.log(pair[0] + ': ' + pair[1]);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  actualizar(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<ApiResponse<DocumentoFisico>> {
    return this.http.delete<ApiResponse<DocumentoFisico>>(`${this.apiUrl}/${id}`);
  }
}
