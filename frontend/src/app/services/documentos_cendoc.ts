// nuevo/frontend/src/app/services/documentos_cendoc.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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
  palabras_clave: string;
  // Datos del municipio (JOIN)
  nombre_categoria?: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  data: Documentos_cendoc[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiDocumentos_cendoc {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/documentos_cendoc`,{});
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getArchivosFiltrados(params: {
    busqueda?: string,
    categoria?: number[],
    autor?: string,
    palabras_clave?: string,
    ordenar?: string,
    limite?: number,
    pagina?: number
  }): Observable<ApiResponse & { total?: number, pagina?: number, totalPaginas?: number }> {
    let httpParams = new HttpParams();

    // Agregar búsqueda
    if (params.busqueda) {
      httpParams = httpParams.set('busqueda', params.busqueda);
    }

    // Agregar categoría
    if (params.categoria) {
      httpParams = httpParams.set('categoria',  params.categoria.join(','));
    }

    // Agregar autor
    if (params.autor) {
      httpParams = httpParams.set('autor', params.autor);
    }

    // Agregar palabras clave
    if (params.palabras_clave) {
      httpParams = httpParams.set('palabras_clave', params.palabras_clave);
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

    console.log('Llamando a API documentos_cendoc con params:', httpParams.toString());

    return this.http.get<any>(`${this.apiUrl}/documentos_cendoc/filtrados`, {
      params: httpParams
    });
  }

  // Obtener conteo de archivos por municipio
  getConteosPorDocumentos_cendoc(): Observable<{success: boolean, data: {id_categoria_cendoc: number, nombre_categoria_cendoc: string, contador: number}[]}> {
    return this.http.get<any>(`${this.apiUrl}/documentos_cendoc/conteos-documentos_cendoc`);
  }
}