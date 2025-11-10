// nuevo/frontend/src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, EMPTY, lastValueFrom } from 'rxjs';
import { catchError, map, tap, filter, take, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
//import { SKIP_AUTH_REDIRECT } from '../interceptors/auth.interceptor';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: { user: User };
  needsRefresh?: boolean;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Estado de autenticación
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // Estado de inicialización
  private readonly initializationComplete = new BehaviorSubject<boolean>(false);
  public readonly initializationComplete$ = this.initializationComplete.asObservable();

  // Control de refresh en progreso
  private refreshInProgress = false;
  private refreshTokenPromise: Promise<User | null> | null = null;

  // ==================== GETTERS ====================

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // ==================== INICIALIZACIÓN ====================

  async initAuth(): Promise<void> {
    if (this.initializationComplete.value) {
      console.log('✅ [AUTH] Ya inicializado');
      return;
    }

    console.log('🔄 [AUTH] Inicializando autenticación...');
    console.log('🔄 [AUTH] Platform:', this.isBrowser ? 'Browser' : 'Server');

    if (!this.isBrowser) {
      console.log('✅ [AUTH] SSR - Omitiendo verificación de sesión');
      this.currentUserSubject.next(null);
      this.initializationComplete.next(true);
      return;
    }

    // ✅ Intentar restaurar sesión directamente al iniciar
    try {
      const user = await this.verifySession();

      if (user) {
        console.log('✅ [AUTH] Sesión restaurada:', user.email);
        this.currentUserSubject.next(user);
      } else {
        console.log('🚫 [AUTH] No hay sesión activa');
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error en inicialización:', error);
      this.currentUserSubject.next(null);
    } finally {
      console.log('✅ [AUTH] Inicialización completada');
      this.initializationComplete.next(true);
    }
  }

  waitForInitialization(): Observable<boolean> {
    return this.initializationComplete$.pipe(
      filter((initialized) => initialized),
      take(1)
    );
  }

  // ==================== VERIFICACIÓN DE SESIÓN ====================

  async verifySession(): Promise<User | null> {
    if (!this.isBrowser) return null;

    console.log('🔍 [AUTH] Verificando sesión...');

    try {
      const response = await lastValueFrom(
        this.http.get<AuthResponse>(`${this.apiUrl}/verify`, { withCredentials: true })
      );

      if (response?.success && response.data?.user) {
        const user = response.data.user;
        this.currentUserSubject.next(user); // ✅ Actualiza BehaviorSubject
        return user;
      }

      if (response?.needsRefresh) {
        console.log('🔄 [AUTH] Token expirado en verify, intentando renovar...');
        return await this.refreshTokens();
      }

      this.currentUserSubject.next(null);
      return null;
    } catch (error: any) {
      if (error?.status === 401 && !error?.error?.needsRefresh) {
        console.log('ℹ️  [AUTH] No hay sesión activa (sin cookies)');
        this.currentUserSubject.next(null);
        return null;
      }

      if (error?.error?.needsRefresh) {
        console.log('🔄 [AUTH] Token expirado (error), intentando renovar...');
        try {
          return await this.refreshTokens();
        } catch {
          this.currentUserSubject.next(null);
          return null;
        }
      }

      console.error('❌ [AUTH] Error verificando sesión:', error);
      this.currentUserSubject.next(null);
      return null;
    }
  }

  // ==================== LOGIN ====================

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success && response.data?.user) {
            console.log('✅ [AUTH] Login exitoso:', response.data.user.email);
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError('login'))
      );
  }

  // ==================== REGISTRO ====================

  register(userData: {
    nombre: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success && response.data?.user) {
            console.log('✅ [AUTH] Registro exitoso:', response.data.user.email);
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError('register'))
      );
  }

  // ==================== LOGOUT ====================

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        console.log('👋 [AUTH] Sesión cerrada');
        this.currentUserSubject.next(null);
      }),
      catchError((error) => {
        console.error('❌ [AUTH] Error en logout:', error);
        this.currentUserSubject.next(null);
        return EMPTY;
      })
    );
  }

  // ==================== REFRESH TOKEN ====================

  async refreshTokens(): Promise<User | null> {
    if (!this.isBrowser) return null;

    if (this.refreshInProgress && this.refreshTokenPromise) {
      console.log('⏳ [AUTH] Refresh ya en progreso, esperando...');
      return this.refreshTokenPromise;
    }

    this.refreshInProgress = true;
    console.log('🔄 [AUTH] Renovando tokens...');

    this.refreshTokenPromise = this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.success && response.data?.user) {
            const user = response.data.user;
            console.log('✅ [AUTH] Tokens renovados exitosamente');
            this.currentUserSubject.next(user); // ✅ Actualiza también aquí
            return user;
          }
          this.currentUserSubject.next(null);
          return null;
        }),
        catchError((error) => {
          console.error('❌ [AUTH] Error renovando tokens:', error);
          this.currentUserSubject.next(null);
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInProgress = false;
          this.refreshTokenPromise = null;
        })
      )
      .toPromise() as Promise<User | null>;

    return this.refreshTokenPromise;
  }

  // ✅ NUEVO: Versión Observable del refresh (para el interceptor)
  refreshTokensObservable(): Observable<User | null> {
    if (!this.isBrowser) {
      return throwError(() => new Error('Not in browser'));
    }

    console.log('🔄 [AUTH] Renovando tokens (Observable)...');

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.success && response.data?.user) {
            const user = response.data.user;
            console.log('✅ [AUTH] Tokens renovados exitosamente');
            this.currentUserSubject.next(user); // ✅
            return user;
          }
          this.currentUserSubject.next(null);
          return null;
        }),
        catchError((error) => {
          console.error('❌ [AUTH] Error renovando tokens:', error);
          this.currentUserSubject.next(null);
          return throwError(() => error);
        })
      );
  }

  // ==================== PERFIL ====================

  getProfile(): Observable<User> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      map((response) => {
        if (response.success && response.data?.user) {
          return response.data.user;
        }
        throw new Error('No se pudo obtener el perfil');
      }),
      catchError(this.handleError('getProfile'))
    );
  }

  // ==================== MANEJO DE ERRORES ====================

  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`❌ [AUTH] Error en ${operation}:`, error);

      let errorMessage = 'Ocurrió un error inesperado';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado';
      } else if (error.status === 403) {
        errorMessage = 'Acceso denegado';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor';
      }

      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        error: error.error,
      }));
    };
  }
}
