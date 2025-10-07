import { Injectable } from '@angular/core';
//esto es para comunicarse con el backend
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  //url del backend
  private apiUrl = 'http://localhost:3000/api';
  //inyecta el servicio HttpClient
  constructor(private http: HttpClient) {}
  getMessage():Observable<any> {
    //realiza una solicitud GET a la URL del backend
    return this.http.get(`${this.apiUrl}/items`,{});
  }
}
