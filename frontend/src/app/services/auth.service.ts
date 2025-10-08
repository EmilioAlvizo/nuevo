import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

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
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    // Detectar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Cargar usuario desde localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  // Registro
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  // Login
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  // Logout
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const token = this.getToken();
    if (!token) return false;

    // Verificar si el token ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  // Obtener token
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem('token');
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Verificar rol
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol === role : false;
  }

  // Guardar sesión
  private setSession(authData: { user: User; token: string }): void {
    if (this.isBrowser) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    this.currentUserSubject.next(authData.user);
  }

  // Obtener usuario del storage
  private getUserFromStorage(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}