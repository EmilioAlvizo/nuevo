// nuevo/frontend/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Siempre incluir credenciales (cookies)
  const clonedReq = req.clone({ withCredentials: true });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // URLs que NO deben intentar refresh automático (evita loops)
      const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
      const shouldSkipRefresh = skipRefreshUrls.some((url) => req.url.includes(url));

      // Si es 401 con needsRefresh (backend indica que hay refresh token) -> intentar refresh
      if (error.status === 401 && error.error?.needsRefresh === true && !shouldSkipRefresh) {
        console.log('🔄 [INTERCEPTOR] Token expirado detectado en:', req.url);
        console.log('🔄 [INTERCEPTOR] Intentando renovar tokens...');

        return authService.refreshTokensObservable().pipe(
          switchMap((user) => {
            if (user) {
              console.log('✅ [INTERCEPTOR] Tokens renovados exitosamente');
              console.log('🔄 [INTERCEPTOR] Reintentando petición original:', req.url);

              // Reintentar la petición original con las cookies actualizadas
              const retryReq = req.clone({ withCredentials: true });
              return next(retryReq);
            }

            // No se pudieron renovar -> redirigir a login
            console.warn('❌ [INTERCEPTOR] No se pudo renovar, redirigiendo a login');
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            console.error('❌ [INTERCEPTOR] Error en refresh:', refreshError);

            if (refreshError?.error?.code === 'TOKEN_NOT_FOUND_OR_REVOKED') {
              console.warn('🚨 [INTERCEPTOR] Sesión inválida - tokens huérfanos detectados');
            }

            // Redirigir al login indicando causa
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url, reason: 'session-expired' },
            });
            return throwError(() => refreshError);
          })
        );
      }

      // --- CAMBIO CLAVE: No redirigir automáticamente por cualquier 401 ---
      // Antes: redirigías siempre en 401 sin needsRefresh -> causaba redirecciones indeseadas
      // Ahora: devolvemos el error para que la UI/guard/llamada que originó la petición decida qué hacer.
      if (error.status === 401 && !shouldSkipRefresh) {
        console.warn(
          '🚫 [INTERCEPTOR] 401 recibido (sin needsRefresh). No se redirige automáticamente.'
        );
        // opcional: podrías emitir un evento global o llamar authService.currentUserSubject.next(null)
        // si quieres limpiar estado aquí, pero preferimos dejar que AuthService / guard lo manejen.
        return throwError(() => error);
      }

      // Para 403 (acceso denegado) solo logueamos (no navegamos)
      if (error.status === 403) {
        console.warn('🚫 [INTERCEPTOR] Acceso denegado (403) en:', req.url);
      }

      // Para otros errores, propagar
      return throwError(() => error);
    })
  );
};
