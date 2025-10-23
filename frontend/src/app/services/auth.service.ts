// nuevo/frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, of } from 'rxjs';
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
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  //private isBrowser: boolean;

  private authChecked = false;

  constructor(
    private http: HttpClient,
    private router: Router //@Inject(PLATFORM_ID) platformId: Object
  ) {
    /*
    // Detectar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Cargar usuario desde localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }*/
    this.checkAuth().subscribe();
  }

  // Registro
  register(userData: any): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, { withCredentials: true })
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
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
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
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.currentUserSubject.next(null);
        this.authChecked = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        // Aunque falle, limpiamos el estado local
        this.currentUserSubject.next(null);
        this.authChecked = false;
        this.router.navigate(['/login']);
      },
    });
  }

  // ✅ Verificar autenticación (consulta al backend)
  checkAuth(): Observable<User | null> {
    // Si ya verificamos y hay usuario, retornar el usuario actual
    if (this.authChecked && this.currentUserSubject.value) {
      return of(this.currentUserSubject.value);
    }

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
          console.error('Error verificando autenticación:', error);
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
