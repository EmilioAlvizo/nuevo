import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Api {
  //url del backend
  private apiUrl = 'http://localhost:3000';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage() {
    //realiza una solicitud GET a la URL del backend
    return this.http.get(`${this.apiUrl}/`);
  }
}
