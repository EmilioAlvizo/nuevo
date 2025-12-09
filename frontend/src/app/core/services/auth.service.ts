// nuevo/frontend/src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, lastValueFrom, throwError } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ==================== STATE (SIGNALS) ====================
  // Estado interno mutable
  private readonly _currentUser = signal<User | null>(null);
  private readonly _initializationComplete = signal<boolean>(false);
  private readonly _loading = signal<boolean>(false);

  // Estado público de solo lectura
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly initializationComplete = this._initializationComplete.asReadonly();
  public readonly isLoading = this._loading.asReadonly();

  // Estado derivado (Computed)
  public readonly isLoggedIn = computed(() => !!this._currentUser());

  // Control de refresh (interno)
  private refreshInProgress = false;
  private refreshTokenPromise: Promise<User | null> | null = null;

  // ==================== INICIALIZACIÓN ====================

  async initAuth(): Promise<void> {
    if (this._initializationComplete()) return;

    if (!this.isBrowser) {
      this._initializationComplete.set(true);
      return;
    }

    try {
      await this.verifySession();
    } catch (error) {
      console.error('❌ [AUTH] Error init:', error);
      this._currentUser.set(null);
    } finally {
      this._initializationComplete.set(true);
    }
  }

  // ==================== VERIFICACIÓN ====================

  async verifySession(): Promise<User | null> {
    if (!this.isBrowser) return null;
    
    // Evita llamadas redundantes si ya estamos validando
    if(this._loading()) return null; 

    try {
      const response = await lastValueFrom(
        this.http.get<AuthResponse>(`${this.apiUrl}/verify`, { withCredentials: true })
      );

      if (response?.success && response.data?.user) {
        this._currentUser.set(response.data.user);
        return response.data.user;
      }

      if (response?.needsRefresh) {
        return await this.refreshTokens();
      }

      this._currentUser.set(null);
      return null;
    } catch (error: any) {
      if (error?.error?.needsRefresh) {
         try { return await this.refreshTokens(); } catch { return null; }
      }
      this._currentUser.set(null);
      return null;
    }
  }

  // ==================== AUTH METHODS ====================

  login(email: string, password: string): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success && response.data?.user) {
            this._currentUser.set(response.data.user);
          }
        }),
        finalize(() => this._loading.set(false))
      );
  }

  // ✅ AGREGADO: Método Register faltante
  register(userData: {
    nombre: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, { withCredentials: true })
      .pipe(
        tap((response) => {
          // Si el registro loguea automáticamente al usuario, actualizamos el estado
          if (response.success && response.data?.user) {
            this._currentUser.set(response.data.user);
          }
        }),
        finalize(() => this._loading.set(false))
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this._currentUser.set(null)),
      catchError(() => {
        this._currentUser.set(null);
        return of(void 0);
      })
    );
  }

  // ==================== REFRESH TOKEN ====================

  async refreshTokens(): Promise<User | null> {
    if (!this.isBrowser) return null;
    if (this.refreshInProgress && this.refreshTokenPromise) return this.refreshTokenPromise;

    this.refreshInProgress = true;
    
    this.refreshTokenPromise = lastValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
    ).then(response => {
       if (response.success && response.data?.user) {
          this._currentUser.set(response.data.user);
          return response.data.user;
       }
       this._currentUser.set(null);
       return null;
    }).catch(() => {
       this._currentUser.set(null);
       return null;
    }).finally(() => {
       this.refreshInProgress = false;
       this.refreshTokenPromise = null;
    });

    return this.refreshTokenPromise;
  }
  
  // Para el interceptor
  refreshTokensObservable(): Observable<User | null> {
    if (!this.isBrowser) return throwError(() => new Error('Not browser'));

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
          map(res => {
              if(res.success && res.data?.user) {
                  this._currentUser.set(res.data.user);
                  return res.data.user;
              }
              this._currentUser.set(null);
              return null;
          }),
          catchError((err) => {
              this._currentUser.set(null);
              return throwError(() => err);
          })
      );
  }
}