// nuevo/frontend/src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { of, from, Observable } from 'rxjs';
import { catchError, map, switchMap, take, timeout } from 'rxjs/operators';

/**
 * ✅ AuthGuard simple:
 * - Espera a que AuthService termine de inicializarse
 * - Si hay sesión → permite acceso
 * - Si no hay sesión → redirige a /login
 */
export const AuthGuard: CanActivateFn = (
  route,
  state
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('🛡️ [GUARD] Verificando acceso a:', state.url);

  // SSR (server-side rendering): permitir acceso
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  // Esperar inicialización del AuthService
  return authService.waitForInitialization().pipe(
    timeout(3000),
    take(1),
    switchMap(() => {
      // ✅ Si ya hay usuario cargado en memoria, permitir acceso
      if (authService.currentUser) {
        console.log('✅ [GUARD] Usuario autenticado en memoria:', authService.currentUser.email);
        return of(true);
      }

      // 🚀 Si no hay usuario en memoria, intentar verificar sesión con el backend
      console.log('🔍 [GUARD] Verificando sesión en backend...');
      return from(authService.verifySession()).pipe(
        map(user => {
          if (user) {
            console.log('✅ [GUARD] Sesión válida:', user.email);
            return true;
          }

          console.warn('❌ [GUARD] No autenticado, redirigiendo a login');
          return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }),
        catchError(err => {
          console.error('❌ [GUARD] Error verificando sesión:', err);
          return of(
            router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url },
            })
          );
        })
      );
    }),
    catchError(err => {
      console.error('❌ [GUARD] Error general:', err);
      return of(
        router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        })
      );
    })
  );
};
