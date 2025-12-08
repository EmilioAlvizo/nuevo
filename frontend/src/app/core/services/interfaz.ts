// src/app/core/services/interfaz.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface InterfazConfig {
  id_config: number;
  nombre: string;
  auxiliar: string;
  archivo: string;
  estatus: string;
}

export interface InterfazResponse {
  success: boolean;
  data?: InterfazConfig[] | InterfazConfig;
  message?: string;
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InterfazService {
  private apiUrl = `${environment.apiUrl}/interfaz`;
  private logoSubject = new BehaviorSubject<string>('');
  public logo$ = this.logoSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===============================
  // CRUD METHODS
  // ===============================

  // Obtener todas las configuraciones
  getAll(): Observable<InterfazConfig[]> {
    return this.http.get<InterfazResponse>(this.apiUrl).pipe(
      map(response => (response.data as InterfazConfig[]) || [])
    );
  }

  // Obtener configuración por ID
  getById(id: number): Observable<InterfazConfig | undefined> {
    return this.http.get<InterfazResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data as InterfazConfig)
    );
  }


  // Actualizar configuración
  update(id: number, formData: FormData): Observable<InterfazResponse> {
    return this.http.put<InterfazResponse>(`${this.apiUrl}/${id}`, formData);
  }


  // ===============================
  // SPECIFIC METHODS
  // ===============================

  // Obtener configuración por nombre
  getByNombre(nombre: string): Observable<InterfazConfig | undefined> {
    return this.getAll().pipe(
      map(configs => configs.find(c => c.nombre === nombre && c.estatus === 'A'))
    );
  }

  // Obtener URL del logo izquierda (ID fijo = 1)
  getLogoIzquierda(): Observable<string> {
    return this.getById(1).pipe(
      map(config => {
        if (config && config.archivo) {
          return this.buildImageUrl(config.id_config, config.archivo);
        }
        return '/assets/logo_1.png'; // Logo por defecto
      }),
      tap(url => this.logoSubject.next(url))
    );
  }

  // Obtener URL del logo derecha
  getLogoDerecha(): Observable<string> {
    return this.getByNombre('logo_derecha').pipe(
      map(config => {
        if (config && config.archivo) {
          return this.buildImageUrl(config.id_config, config.archivo);
        }
        return '/assets/logo_2.png'; // Logo por defecto
      })
    );
  }

  // Construir URL de imagen
  private buildImageUrl(id: number, archivo: string): string {
    return `http://localhost:3000/public/interfaz/${id}/${archivo}`;
  }

  // Método genérico para obtener cualquier configuración por nombre
  getConfigValue(nombre: string): Observable<string> {
    return this.getByNombre(nombre).pipe(
      map(config => {
        if (config && config.archivo) {
          return this.buildImageUrl(config.id_config, config.archivo);
        }
        return config?.auxiliar || '';
      })
    );
  }
}