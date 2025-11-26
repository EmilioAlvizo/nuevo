// nuevo/frontend/src/app/core/services/archivos_municipio.ts

import { Injectable, inject } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Archivos_municipio {
  id_archivo: number;
  nombre_archivo: string;
  fecha_archivo: string;
  id_municipio: number;
  archivo: string;
  estatus_archivo: string;
  fecha_modificacion: string;
  tipo_archivo: string;
  categoria_archivo: string;
  palabras_clave: string;
  subcategoria_archivo: string;
  // Datos del municipio (JOIN)
  nombre_municipio?: string;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiArchivos_municipio {
  //url del backend
  private apiUrl = `${environment.apiUrl}/archivos_municipio`;
  private http = inject(HttpClient);

  getMessage(): Observable<ApiResponse<Archivos_municipio>> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse<Archivos_municipio>>(this.apiUrl);
  }

  get_archivos(): Observable<ApiResponse<Archivos_municipio>> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse<Archivos_municipio>>(`${this.apiUrl}/filtrados`, {});
  }

  getValoresUnicos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/valores-unicos`);
  }

  getFiltrados(filtros: any): Observable<ApiResponsePaginated<Archivos_municipio>> {
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
    console.log('Llamando a API Archivos_municipio con params:', params.toString());

    return this.http.get<ApiResponsePaginated<Archivos_municipio>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  createArchivo(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  // Eliminar archivo
  deleteArchivo(id: number): Observable<{ success: boolean; message: string; id: number }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  updateArchivo(id: number, formData: FormData) {
    return this.http.put<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/${id}`,
      formData
    );
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getArchivosFiltrados(params: {
    municipios?: number[];
    busqueda?: string;
    categoria?: string;
    palabras_clave?: string;
    tipo?: string;
    ordenar?: string;
    limite?: number;
    pagina?: number;
  }): Observable<
    ApiResponse<Archivos_municipio> & { total?: number; pagina?: number; totalPaginas?: number }
  > {
    let httpParams = new HttpParams();

    // Agregar municipios seleccionados
    if (params.municipios && params.municipios.length > 0) {
      httpParams = httpParams.set('municipios', params.municipios.join(','));
    }

    // Agregar búsqueda
    if (params.busqueda) {
      httpParams = httpParams.set('busqueda', params.busqueda);
    }

    // Agregar categoría
    if (params.categoria) {
      httpParams = httpParams.set('categoria', params.categoria);
    }

    // Agregar palabras clave
    if (params.palabras_clave) {
      httpParams = httpParams.set('palabra_clave', params.palabras_clave);
    }

    // Agregar tipo
    if (params.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }

    // Agregar ordenamiento
    if (params.ordenar) {
      httpParams = httpParams.set('ordenar', params.ordenar);
    }

    // Paginación
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }

    if (params.pagina) {
      httpParams = httpParams.set('pagina', params.pagina.toString());
    }

    console.log('Llamando a API archivos_municipio con params:', httpParams.toString());

    return this.http.get<any>(`${this.apiUrl}/filtrados`, {
      params: httpParams,
    });
  }

  // Obtener conteo de archivos por municipio
  getConteosPorMunicipio(): Observable<{
    success: boolean;
    data: { id_municipio: number; nombre: string; contador: number }[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/conteos`);
  }
}
