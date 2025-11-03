// nuevo/frontend/src/app/core/services/archivos_municipio.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Archivos_municipio {
  id_archivo: number;
  nombre_archivo: string;
  fecha_archivo: Date;
  id_municipio: number;
  archivo: string;
  estatus_archivo: string;
  fecha_modificacion: Date;
  tipo_archivo: string;
  categoria_archivo: string;
  palabras_clave: string;
  subcategoria_archivo: string;
  // Datos del municipio (JOIN)
  nombre_municipio?: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

export interface ApiResponsePaginated<T> {
  success: boolean;
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

interface FiltrosArchivos {
  municipios?: number[];
  busqueda?: string;
  categoria?: string;
  palabra_clave?: string;
  tipo?: string;
  ordenar?: string;
  limite?: number;
  pagina?: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiArchivos_municipio {
  //url del backend
  private apiUrl = `${environment.apiUrl}/archivos_municipio`;
  private http = inject(HttpClient);

  //realiza una solicitud GET a la URL del backend
  getMessage(): Observable<ApiResponse<Archivos_municipio[]>> {
    return this.http.get<ApiResponse<Archivos_municipio[]>>(this.apiUrl);
  }

  //realiza una solicitud GET a la URL del backend
  get_archivos(): Observable<ApiResponse<Archivos_municipio[]>> {
    return this.http.get<ApiResponse<Archivos_municipio[]>>(this.apiUrl);
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getArchivosFiltrados(
    filtros: any
  ): Observable<ApiResponsePaginated<Archivos_municipio>> {
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
    console.log('Llamando a API archivos_municipio con params:', params.toString());

    return this.http.get<ApiResponsePaginated<Archivos_municipio>>(`${this.apiUrl}/filtrados`, {
      params,
    });
  }

  // Obtener conteo de archivos por municipio
  getConteosPorMunicipio(): Observable<
    ApiResponse<{ id_municipio: number; nombre: string; contador: number }[]>
  > {
    return this.http.get<ApiResponse<{ id_municipio: number; nombre: string; contador: number }[]>>(
      `${this.apiUrl}/conteos`
    );
  }

  // Obtener un archivo por ID
  getArchivoById(id: number): Observable<ApiResponse<Archivos_municipio>> {
    return this.http.get<ApiResponse<Archivos_municipio>>(`${this.apiUrl}/${id}`);
  }

  // Crear archivo (sin upload de archivo físico)
  createArchivo(data: Partial<Archivos_municipio>): Observable<ApiResponse<Archivos_municipio>> {
    return this.http.post<ApiResponse<Archivos_municipio>>(this.apiUrl, data);
  }

  // ✅ Crear archivo con upload (FormData)
  createArchivoConUpload(formData: FormData): Observable<ApiResponse<Archivos_municipio>> {
    return this.http.post<ApiResponse<Archivos_municipio>>(this.apiUrl, formData);
  }

  // Actualizar archivo
  updateArchivo(
    id: number,
    data: Partial<Archivos_municipio>
  ): Observable<ApiResponse<Archivos_municipio>> {
    return this.http.put<ApiResponse<Archivos_municipio>>(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar archivo
  deleteArchivo(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // ✅ OPCIONAL: Descargar archivo
  downloadArchivo(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
    });
  }
}
