//nuevo/frontend/src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError, firstValueFrom, timer, filter, take } from 'rxjs';
import { retry } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // ✅ Observable para saber cuándo terminó la inicialización
  private initializationComplete = new BehaviorSubject<boolean>(false);
  public initializationComplete$ = this.initializationComplete.asObservable();
  
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) { }

  // -------------------- LOGIN --------------------
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.success && res.data?.user) {
          this.currentUserSubject.next(res.data.user);
        }
      })
    );
  }

  // ✅ Registro 
  register(userData: any) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      userData,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.currentUserSubject.next(response.data.user);
        }
      }),
      catchError(err => {
        console.error('❌ [AUTH] Error en registro:', err);
        return throwError(() => err);
      })
    );
  }

  // -------------------- LOGOUT --------------------
  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
      })
    );
  }

  // -------------------- VERIFY --------------------
  verify() {
    return this.http.get<AuthResponse>(`${this.apiUrl}/verify`, { withCredentials: true }).pipe(
      switchMap(res => {
        if (res.success && res.data?.user) {
          this.currentUserSubject.next(res.data.user);
          return of(res.data.user);
        }

        // Si el token expiró, intentar refrescar
        if (res.needsRefresh) {
          return this.refresh().pipe(
            catchError(() => {
              this.currentUserSubject.next(null);
              return of(null);
            })
          );
        }

        this.currentUserSubject.next(null);
        return of(null);
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  // -------------------- REFRESH --------------------
  refresh() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => {
        if (res.success && res.data?.user) {
          this.currentUserSubject.next(res.data.user);
        }
      }),
      map(res => res.data?.user || null)
    );
  }

  // -------------------- PERFIL --------------------
  getProfile() {
    return this.http.get<AuthResponse>(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  // -------------------- ACCESO ACTUAL --------------------
  get currentUser() {
    return this.currentUserSubject.value;
  }

  get isLoggedIn() {
    return !!this.currentUserSubject.value;
  }

  // ✅ Método para que el guard espere la inicialización
  waitForInitialization(): Observable<boolean> {
    return this.initializationComplete$.pipe(
      filter(initialized => initialized),
      take(1)
    );
  }

  // -------------------- INIT AL ARRANCAR APP --------------------
  async initAuth(): Promise<void> {
    // ✅ Evitar múltiples inicializaciones simultáneas
    if (this.isInitializing && this.initializationPromise) {
      console.log('⏳ [AUTH] Ya hay una inicialización en curso, esperando...');
      return this.initializationPromise;
    }

    if (this.currentUser) {
      console.log('✅ [AUTH] Usuario ya cargado:', this.currentUser.email);
      this.initializationComplete.next(true);
      return Promise.resolve();
    }

    this.isInitializing = true;
    console.log('🔄 [AUTH] Inicializando autenticación...');

    this.initializationPromise = new Promise(async (resolve) => {
      try {
        // ✅ Esperar un poco para que las cookies estén disponibles
        await new Promise(r => setTimeout(r, 200));
        
        const user = await firstValueFrom(
          this.verify().pipe(
            // ✅ Reintentar hasta 3 veces con delay incremental
            retry({
              count: 3,
              delay: (error, retryCount) => {
                console.log(`🔄 [AUTH] Reintento ${retryCount}/3...`);
                return timer(retryCount * 200);
              }
            })
          )
        );

        if (user) {
          console.log('✅ [AUTH] Sesión válida:', user.email);
        } else {
          console.log('🚫 [AUTH] No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ [AUTH] Error al inicializar:', error);
        this.currentUserSubject.next(null);
      } finally {
        this.isInitializing = false;
        this.initializationComplete.next(true); // ✅ Marcar como completado
        resolve();
      }
    });

    return this.initializationPromise;
  }
}