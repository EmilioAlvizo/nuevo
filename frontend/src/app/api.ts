import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// usar Observable<any> es una mala practica, por ello usamos interfaces (ejemplo para municipio)
export interface Municipio {
  id_municipio: number;
  nombre: string;
  Fecha_Captura: string;
  pdf: string;
}

@Injectable({
  providedIn: 'root',
})

export class Api {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<Municipio[]> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get<Municipio[]>(`${this.apiUrl}/items`,{});
  }
}
