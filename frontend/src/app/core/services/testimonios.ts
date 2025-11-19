// nuevo/frontend/src/app/services/testimonios.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject  } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaginated } from '../shared/interface';

export interface Testimonios {
  id_testimonios: number;
  id_municipio: number;
  nombreM: string;
  nombreMunicipio: string;
  descripcion: string;
  fecha_modificacion: string;
  imagenT: string;
  estatus: string
  correo: string;
  telefono: number;
}

@Injectable({
  providedIn: 'root',
})

export class ApiTestimonios {
  private apiUrl = `${environment.apiUrl}/testimonios`;
  private http = inject(HttpClient);

  private testimoniosSubject = new BehaviorSubject<Testimonios[]>([]);
testimonios$ = this.testimoniosSubject.asObservable();


  getTestimonios():Observable<ApiResponse<Testimonios>> {
    return this.http.get<ApiResponse<Testimonios>>(this.apiUrl).pipe(
    tap(res => {
      if (res.data) {
        this.testimoniosSubject.next(res.data);
      }
    })
  );
  }

  createTestimonio(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData).pipe(
    tap((res: any) => {
      if (res.success && res.data) {
        const current = this.testimoniosSubject.value;
        this.testimoniosSubject.next([res.data, ...current]);
      }
    })
  );
  }

  updateTestimonio(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData).pipe(
    tap((res: any) => {
      if (res.success && res.data) {
        const updated = this.testimoniosSubject.value.map(t =>
          t.id_testimonios === id ? { ...t, ...res.data } : t
        );
        this.testimoniosSubject.next(updated);
      }
    })
  );
  }

  deleteTestimonio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
   
}