// nuevo/frontend/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // ✅ Siempre incluir credenciales (cookies)
  const clonedReq = req.clone({
    withCredentials: true,
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ✅ URLs que NO deben intentar refresh automático
      // Solo excluimos login, register y el propio refresh para evitar loops
      const skipRefreshUrls = [
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
      ];

      const shouldSkipRefresh = skipRefreshUrls.some(url => 
        req.url.includes(url)
      );

      // ✅ Si es 401 con needsRefresh y NO es una URL excluida, intentar refresh
      if (
        error.status === 401 && 
        error.error?.needsRefresh === true && 
        !shouldSkipRefresh
      ) {
        console.log('🔄 [INTERCEPTOR] Token expirado detectado en:', req.url);
        console.log('🔄 [INTERCEPTOR] Intentando renovar tokens...');

        // Usar el método Observable directamente
        return authService.refreshTokensObservable().pipe(
          switchMap(user => {
            if (user) {
              console.log('✅ [INTERCEPTOR] Tokens renovados exitosamente');
              console.log('🔄 [INTERCEPTOR] Reintentando petición original:', req.url);
              
              // ✅ Reintentar la petición original con las cookies actualizadas
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
            
            // Si el error es TOKEN_NOT_FOUND_OR_REVOKED, la sesión no es válida
            if (refreshError?.error?.code === 'TOKEN_NOT_FOUND_OR_REVOKED') {
              console.warn('🚨 [INTERCEPTOR] Sesión inválida - tokens huérfanos detectados');
            }
            
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url, reason: 'session-expired' }
            });
            return throwError(() => error);
          })
        );
      }

      // ✅ Si es 401 SIN needsRefresh (no hay refreshToken), redirigir a login
      if (error.status === 401 && !shouldSkipRefresh) {
        console.warn('🚫 [INTERCEPTOR] 401 sin refresh disponible, redirigiendo a login');
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url }
        });
      }

      // ✅ Para 403 (acceso denegado)
      if (error.status === 403) {
        console.warn('🚫 [INTERCEPTOR] Acceso denegado (403)');
      }

      // Para otros errores, propagar
      return throwError(() => error);
    })
  );
};