// nuevo/frontend/src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { of, from, Observable } from 'rxjs';
import { catchError, map, switchMap, take, timeout, filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * ✅ AuthGuard corregido:
 * - Espera a que AuthService termine de inicializarse
 * - Si hay sesión → permite acceso
 * - Si no hay sesión → redirige a /login
 */
export const AuthGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('🛡️ [GUARD] Verificando acceso a:', state.url);

  // SSR (server-side rendering): permitir acceso
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  // Convertir el signal de inicialización a Observable y esperar a que sea true
  return toObservable(authService.initializationComplete).pipe(
    filter((complete) => complete), // Esperar hasta que sea true
    take(1), // Tomar solo el primer valor true
    timeout(5000), // Timeout de 5 segundos
    switchMap(() => {
      const user = authService.currentUser(); // Leer el signal

      // ✅ Si ya hay usuario cargado en memoria, permitir acceso
      if (user) {
        console.log('✅ [GUARD] Usuario autenticado:', user.email);
        return of(true);
      }

      // 🚀 Si no hay usuario en memoria, intentar verificar sesión con el backend
      console.log('🔍 [GUARD] Sin usuario en memoria, verificando sesión...');
      return from(authService.verifySession()).pipe(
        map((verifiedUser) => {
          if (verifiedUser) {
            console.log('✅ [GUARD] Sesión válida:', verifiedUser.email);
            return true;
          }

          console.warn('❌ [GUARD] No autenticado, redirigiendo a login');
          return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }),
        catchError((err) => {
          console.error('❌ [GUARD] Error verificando sesión:', err);
          return of(
            router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url },
            })
          );
        })
      );
    }),
    catchError((err) => {
      console.error('❌ [GUARD] Timeout o error en inicialización:', err);
      return of(
        router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        })
      );
    })
  );
};
