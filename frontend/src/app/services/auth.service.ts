// nuevo/frontend/src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, of, firstValueFrom } from 'rxjs';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // ✅ Promise para rastrear la verificación inicial
  private initialCheckPromise: Promise<User | null> | null = null;
  private authChecked = false;
  
  private http = inject(HttpClient);

  constructor() {}

  // ✅ Método para inicializar - se llama desde APP_INITIALIZER
  async initialize(): Promise<void> {
    if (!this.initialCheckPromise) {
      this.initialCheckPromise = firstValueFrom(this.performAuthCheck());
    }
    await this.initialCheckPromise;
  }

  // Registro
  register(userData: any): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/register`,
        userData,
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data.user);
            this.authChecked = true;
          }
        }),
        map((response) => response.data!.user)
      );
  }

  // Login
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data.user);
            this.authChecked = true;
          }
        }),
        map((response) => response.data!.user)
      );
  }

  // Logout
  logout(): Observable<void> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.authChecked = true;
        }),
        map(() => void 0),
        catchError(() => {
          this.currentUserSubject.next(null);
          this.authChecked = true;
          return of(void 0);
        })
      );
  }

  // ✅ Verificar autenticación - espera a la verificación inicial
  async checkAuth(): Promise<User | null> {
    // Si hay una verificación inicial en curso, esperarla
    if (this.initialCheckPromise) {
      return this.initialCheckPromise;
    }

    // Si ya verificamos, retornar el valor actual
    if (this.authChecked) {
      return this.currentUserSubject.value;
    }

    // Hacer nueva verificación
    return firstValueFrom(this.performAuthCheck());
  }

  // ✅ Método privado que hace la petición HTTP
  private performAuthCheck(): Observable<User | null> {
    return this.http
      .get<AuthResponse>(`${this.apiUrl}/verify`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.authChecked = true;
            this.currentUserSubject.next(response.data.user);
            return response.data.user;
          }
          this.authChecked = true;
          this.currentUserSubject.next(null);
          return null;
        }),
        catchError((error) => {
          if (error.status !== 401) {
            console.error('⚠️ Error verificando sesión:', error.status, error.statusText);
          }
          this.authChecked = true;
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Verificar si la autenticación ya fue verificada
  isAuthChecked(): boolean {
    return this.authChecked;
  }

  // Verificar rol
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol === role : false;
  }
}