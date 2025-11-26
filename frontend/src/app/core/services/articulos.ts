// // nuevo/frontend/src/app/services/articulos.ts

// import { Injectable } from '@angular/core';
// //esto es para comunicarse con el backend
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, of } from 'rxjs';

// // usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
// export interface Articulos {
//   id_articulo: number;
//   id_revista: number;
//   titulo: string;
//   autor: string;
//   contenido: string;
//   imagen: string;
//   estatus: string;
//   fecha_modificacion: string;
// }

// // Agrega esta nueva interfaz para la respuesta de la API
// export interface ApiResponse {
//   success: boolean;
//   data: Articulos[];
//   total?: number;
// }

// @Injectable({
//   providedIn: 'root',
// })

// //esto es para comunicarse con el backend real
// export class ApiArticulos {
//   //url del backend
//   private apiUrl = 'http://localhost:3000/api';
//   //inyecta el servicio HttpClient
//   constructor(private http: HttpClient) {}

//   //PETICIÓN GET
//   getArticulos():Observable<ApiResponse> {
//     return this.http.get<ApiResponse>(`${this.apiUrl}/articulos`,{});
//   }

//   crearArticulo(formData: FormData) {
//   return this.http.post<any>(`${this.apiUrl}/articulos`, formData);
//   }

//   actualizarArticulo(id: number, data: any){
//   return this.http.put<any>(`${this.apiUrl}/articulos/${id}`, data);
//   }

// }

// nuevo/frontend/src/app/services/articulos.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Tipado de los artículos
export interface Articulos {
  id_articulo: number;
  id_revista: number;
  titulo: string;
  autor: string;
  contenido: string;
  pagina: number;
  imagen: string;
  estatus: string;
  fecha_modificacion: string;
}

// Respuesta genérica de la API
export interface ApiResponse {
  success: boolean;
  data: Articulos[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiArticulos {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getArticulos():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/articulos`,{});
  }

  crearArticulo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/articulos`, formData);
  }

  actualizarArticulo(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/articulos/${id}`, formData);
  }



  // crearArticulo(formData: FormData): Observable<ApiResponse> {
  //   return this.http.post<ApiResponse>(`${this.apiUrl}/articulos`, formData);
  // }

  // actualizarArticulo(id: number, data: Partial<Articulos>): Observable<ApiResponse> {
  //   return this.http.put<ApiResponse>(`${this.apiUrl}/articulos/${id}`, data);
  // }





}
