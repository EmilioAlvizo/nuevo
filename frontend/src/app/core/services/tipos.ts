// nuevo/frontend/src/app/services/tipos.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Interfaz genérica para la respuesta de la API
export interface ApiResponse<T> {
    success: boolean;
    data: T[];
    total?: number;
  }

// Interfaz genérica para el servicio de datos
export interface DataService<T> {
    // Métodos de consulta
    getFiltrados(params?: any): Observable<ApiResponse<T>>;
    getAll?(): Observable<ApiResponse<T>>;
    getById?(id: number | string): Observable<ApiResponse<T>>;
    
    // Métodos de modificación (opcionales)
    crear?(data: Partial<T> | FormData): Observable<ApiResponse<T>>;
    actualizar?(id: number | string, data: Partial<T> | FormData): Observable<ApiResponse<T>>;
    eliminar?(id: number | string): Observable<ApiResponse<T>>;
    eliminarMultiple?(ids: (number | string)[]): Observable<ApiResponse<T>>;
  }