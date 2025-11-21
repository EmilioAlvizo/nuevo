// // nuevo/frontend/src/app/services/propuestas_accion.ts

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, of } from 'rxjs';

// export interface Documento {
//   id: number;
//   id_municipio: number;
//   nombreMunicipio: string;
//   nombreC: string;
//   sexo: string;
//   edad: number;
//   actividad: string;
//   correo: string;
//   zona: string;
//   detalle: string;
//   justificacion: string;
//   fecha_registro: string;
//   necesidades: string;
// }

// export interface ApiResponse {
//   success: boolean;
//   data: Documento[];
// }

// @Injectable({
//   providedIn: 'root',
// })

// export class ApiPropuesta {

//   private apiUrl = 'http://localhost:3000/api';

//   constructor(private http: HttpClient) {}
//   getPropuestas():Observable<ApiResponse> {
//     return this.http.get<ApiResponse>(`${this.apiUrl}/banco`,{});
//   }
  
//   crearPropuesta(formData: FormData) {
//     return this.http.post<any>(`${this.apiUrl}/banco`, formData);
//   }


// }