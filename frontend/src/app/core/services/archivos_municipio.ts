// nuevo/frontend/src/app/services/archivos_municipio.ts

import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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
  palabra_clave: string;
  subcategoria_archivo: string;
  // Datos del municipio (JOIN)
  nombre_municipio?: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  data: Archivos_municipio[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiArchivos_municipio {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //private apiUrl = 'https://mock.apidog.com/m1/1099917-1089948-default/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/archivos_municipio`,{});
  }

  get_archivos():Observable<ApiResponse> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/archivos_municipio/filtrados`,{});
  }

  // ✅ NUEVO - Método con filtros (más eficiente)
  getArchivosFiltrados(params: {
    municipios?: number[],
    busqueda?: string,
    categoria?: string,
    palabra_clave?: string,
    tipo?: string,
    ordenar?: string,
    limite?: number,
    pagina?: number
  }): Observable<ApiResponse & { total?: number, pagina?: number, totalPaginas?: number }> {
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
    if (params.palabra_clave) {
      httpParams = httpParams.set('palabra_clave', params.palabra_clave);
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

    return this.http.get<any>(`${this.apiUrl}/archivos_municipio/filtrados`, {
      params: httpParams
    });
  }

  // Obtener conteo de archivos por municipio
  getConteosPorMunicipio(): Observable<{success: boolean, data: {id_municipio: number, nombre: string, contador: number}[]}> {
    return this.http.get<any>(`${this.apiUrl}/archivos_municipio/conteos-municipio`);
  }
}