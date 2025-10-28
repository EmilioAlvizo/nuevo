// nuevo/frontend/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, from, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Siempre incluir credenciales (cookies)
  const clonedReq = req.clone({
    withCredentials: true,
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // URLs que NO deben intentar refresh automático
      const skipRefreshUrls = [
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/auth/verify',
        '/auth/logout'
      ];

      const shouldSkipRefresh = skipRefreshUrls.some(url => 
        req.url.includes(url)
      );

      // Si es 401 y NO es una URL excluida, intentar refresh
      if (error.status === 401 && !shouldSkipRefresh) {
        console.log('🔄 [INTERCEPTOR] 401 detectado, intentando refresh...');

        // Convertir Promise a Observable y luego usar switchMap
        return from(authService.refreshTokens()).pipe(
          switchMap(user => {
            if (user) {
              // Tokens renovados, reintentar la petición original
              console.log('✅ [INTERCEPTOR] Tokens renovados, reintentando petición');
              
              const retryReq = req.clone({
                withCredentials: true
              });
              
              return next(retryReq);
            } else {
              // No se pudieron renovar, redirigir a login
              console.warn('❌ [INTERCEPTOR] No se pudo renovar, redirigiendo a login');
              router.navigate(['/login'], {
                queryParams: { returnUrl: router.url }
              });
              return throwError(() => error);
            }
          }),
          catchError(refreshError => {
            // Error al renovar, redirigir a login
            console.error('❌ [INTERCEPTOR] Error en refresh:', refreshError);
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url }
            });
            return throwError(() => error);
          })
        );
      }

      // Para otros errores o URLs excluidas, propagar el error
      if (error.status === 403) {
        console.warn('🚫 [INTERCEPTOR] Acceso denegado (403)');
      }

      return throwError(() => error);
    })
  );
};