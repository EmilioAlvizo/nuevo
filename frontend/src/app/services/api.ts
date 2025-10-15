// nuevo/frontend/src/app/services/api.ts

import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Municipio {
  id_municipio: number;
  nombre: string;
  Fecha_Captura: string;
  pdf: string;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  data: Municipio[];
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class Api {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponse> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponse>(`${this.apiUrl}/items`,{});
  }
}

// testimonios
export interface Testimonios {
  id_testimonios: number;
  id_municipio: number;
  nombreMunicipio: string;
  nombreM: string;
  descripcion: string;
  fecha_modificacion: string;
  imagenT: string;
  estatus: string
  correo: string;
  telefono: number;
}

// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponseTestimonios {
  success: boolean;
  data: Testimonios[];
}

@Injectable({
  providedIn: 'root',
})

//esto es para comunicarse con el backend real
export class ApiTestimonios {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<ApiResponseTestimonios> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<ApiResponseTestimonios>(`${this.apiUrl}/testimonios`,{});
  }
}


//esto es para comunicarse con el backend simulado
/*export class Api {
  private usarMock = true;

  private apiUrl = 'http://localhost:3000/api/items';
  
  private mockData: ApiResponse = {
  "success":true,"data":[{
      id_municipio: 1,
      nombre: 'Abasolo',
      Fecha_Captura: '2022-10-19T15:42:11.970Z',
      pdf: '1677619285_118fd15de8062eb76e29.pdf'
    },
    {
      id_municipio: 2,
      nombre: 'Acámbaro',
      Fecha_Captura: '2022-10-19T15:42:22.110Z',
      pdf: '1677619381_a5bfa3eadf24efec9a1b.pdf'
    },
    {
      id_municipio: 3,
      nombre: 'Apaseo El Alto',
      Fecha_Captura: '2022-10-19T15:42:29.703Z',
      pdf: '1677619395_c8fb1220bceecf2af95b.pdf'
    },
    {
      id_municipio: 4,
      nombre: 'Celaya',
      Fecha_Captura: '2023-03-10T12:22:29.703Z',
      pdf: 'celaya_2023.pdf'
    },
    {
      id_municipio: 5,
      nombre: 'León',
      Fecha_Captura: '2024-01-15T09:11:45.500Z',
      pdf: 'leon_2024.pdf'
    },
    {
      id_municipio: 6,
      nombre: 'Irapuato',
      Fecha_Captura: '2024-02-02T18:15:29.703Z',
      pdf: 'irapuato_2024.pdf'
    },
    {
      id_municipio: 7,
      nombre: 'Abalo',
      Fecha_Captura: '2022-10-19T15:42:11.970Z',
      pdf: '1677619285_118fd15de8062eb76e29.pdf'
    },
    {
      id_municipio: 8,
      nombre: 'Acáaro',
      Fecha_Captura: '2022-10-19T15:42:22.110Z',
      pdf: '1677619381_a5bfa3eadf24efec9a1b.pdf'
    },
    {
      id_municipio: 9,
      nombre: 'Apaseo Alto',
      Fecha_Captura: '2022-10-19T15:42:29.703Z',
      pdf: '1677619395_c8fb1220bceecf2af95b.pdf'
    },
    {
      id_municipio: 10,
      nombre: 'Cela',
      Fecha_Captura: '2023-03-10T12:22:29.703Z',
      pdf: 'celaya_2023.pdf'
    },
    {
      id_municipio: 11,
      nombre: 'Lón',
      Fecha_Captura: '2024-01-15T09:11:45.500Z',
      pdf: 'leon_2024.pdf'
    },
    {
      id_municipio: 12,
      nombre: 'Irapuo',
      Fecha_Captura: '2024-02-02T18:15:29.703Z',
      pdf: 'irapuato_2024.pdf'
    }
  ]};

  constructor() {}

  getMessage():Observable<ApiResponse> {
    if (this.usarMock) {
      console.warn('⚠️ Usando datos locales (mock), no se conecta al backend.');
      return of(this.mockData);
    } else {
      // Cuando tengas conexión, cambia usarMock = false y descomenta:
      // return this.http.get<{ data: Municipio[] }>(this.apiUrl).pipe(map(res => res.data));
      return of();
    }
  }
}*/