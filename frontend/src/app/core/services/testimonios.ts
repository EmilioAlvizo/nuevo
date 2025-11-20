// nuevo/frontend/src/app/core/services/testimonios.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
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
  estatus: string;
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

  // 🚀 Cargar inicialmente
  getTestimonios(): Observable<ApiResponse<Testimonios>> {
    return this.http.get<ApiResponse<Testimonios>>(this.apiUrl).pipe(
      tap((res) => {
        console.log('📥 GET testimonios response:', res);
        if (res.data) {
          this.testimoniosSubject.next(res.data);
          console.log('📋 Lista actualizada:', res.data.length, 'items');
        }
      })
    );
  }

  // 🚀 Crear - Con fallback a refresh
  createTestimonio(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      tap((res) => {
        console.log('📤 POST response:', res);
      }),
      switchMap((res) => {
        if (res.success) {
          if (res.data) {
            // ✅ Si el backend devuelve el objeto, agregarlo localmente
            const currentList = this.testimoniosSubject.value;
            const newList = [...currentList, res.data];
            this.testimoniosSubject.next(newList);
            console.log('✅ Testimonio agregado localmente:', res.data);
            console.log('📊 BehaviorSubject ahora tiene:', newList.length, 'items');
            return [res];
          } else {
            // ⚠️ Si NO devuelve data, hacer refresh
            console.warn('⚠️ Backend no devolvió data, haciendo refresh...');
            return this.getTestimonios().pipe(
              tap(() => console.log('🔄 Refresh completado'))
            );
          }
        }
        return [res];
      })
    );
  }

  // 🚀 Editar - Con fallback a refresh
  updateTestimonio(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
      tap((res) => {
        console.log('📤 PUT response:', res);
      }),
      switchMap((res) => {
        if (res.success) {
          if (res.data) {
            // ✅ Si el backend devuelve el objeto, actualizar localmente
            const currentList = this.testimoniosSubject.value;
            const updatedList = currentList.map((t) =>
              t.id_testimonios === id ? { ...t, ...res.data } : t
            );
            this.testimoniosSubject.next(updatedList);
            console.log('✅ Testimonio actualizado localmente:', res.data);
            console.log('📊 BehaviorSubject ahora tiene:', updatedList.length, 'items');
            return [res];
          } else {
            // ⚠️ Si NO devuelve data, hacer refresh
            console.warn('⚠️ Backend no devolvió data, haciendo refresh...');
            return this.getTestimonios().pipe(
              tap(() => console.log('🔄 Refresh completado'))
            );
          }
        }
        return [res];
      })
    );
  }

  // 🚀 Borrar - Actualiza la lista localmente
  deleteTestimonio(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        console.log('📤 DELETE response:', res);
        if (res.success) {
          // Eliminar el testimonio de la lista
          const currentList = this.testimoniosSubject.value;
          const filteredList = currentList.filter((t) => t.id_testimonios !== id);
          this.testimoniosSubject.next(filteredList);
          console.log('✅ Testimonio eliminado localmente, ID:', id);
          console.log('📊 BehaviorSubject ahora tiene:', filteredList.length, 'items');
        }
      })
    );
  }

  // 🔄 Método público para refrescar manualmente
  refresh(): Observable<ApiResponse<Testimonios>> {
    console.log('🔄 Refresh manual solicitado');
    return this.getTestimonios();
  }

  // 🆕 Obtener estado actual del BehaviorSubject sin hacer HTTP
  getCurrentTestimonios(): Testimonios[] {
    return this.testimoniosSubject.value;
  }

  // 🆕 Método para forzar actualización manual del BehaviorSubject
  setTestimonios(data: Testimonios[]): void {
    console.log('🔧 Actualizando BehaviorSubject manualmente con', data.length, 'items');
    this.testimoniosSubject.next(data);
  }
}