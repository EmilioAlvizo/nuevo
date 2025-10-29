// nuevo/frontend/src/app/core/guards/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, timeout, catchError, switchMap } from 'rxjs/operators';
import { Observable, of, from } from 'rxjs';
import { TimeoutError } from 'rxjs';

export const AuthGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('🛡️ [GUARD] Verificando acceso a:', state.url);

  // SSR siempre permite acceso, validará en el cliente
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  // Esperar inicialización del AuthService
  return authService.waitForInitialization().pipe(
    timeout(1),
    take(1),
    switchMap(() => {
      // Si ya hay usuario en memoria, seguimos con ese
      if (authService.currentUser) {
        const requiredRole = route.data['role'];
        if (requiredRole && authService.currentUser.rol !== requiredRole) {
          console.warn('🚫 [GUARD] Rol insuficiente');
          return of(router.createUrlTree(['/unauthorized']));
        }
        console.log('✅ [GUARD] Usuario ya autenticado');
        return of(true);
      }

      // 🚀 Si no hay usuario cargado, verificar con el backend
      console.log('🔍 [GUARD] Sin usuario local, verificando sesión...');
      return from(authService.verifySession()).pipe(
        map(user => {
          if (user) {
            console.log('✅ [GUARD] Sesión válida:', user.email);

            const requiredRole = route.data['role'];
            if (requiredRole && user.rol !== requiredRole) {
              console.warn('🚫 [GUARD] Rol insuficiente');
              return router.createUrlTree(['/unauthorized']);
            }
            return true;
          }

          console.warn('❌ [GUARD] No autenticado, redirigiendo a login');
          return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }),
        catchError((error) => {
          console.error('❌ [GUARD] Error verificando sesión:', error);
          return of(router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }));
        })
      );
    }),
    catchError((error) => {
      console.error('❌ [GUARD] Error general en autenticación:', error);
      return of(router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      }));
    })
  );
};

// ==================== GUARD PARA ROLES ====================

export const RoleGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  const requiredRole = route.data['role'] as string;

  // En SSR, permitir acceso
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  return authService.waitForInitialization().pipe(
    timeout(5000),
    take(1),
    map(() => {
      const user = authService.currentUser;

      if (!user) {
        console.warn('❌ [ROLE-GUARD] No autenticado');
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      if (user.rol !== requiredRole) {
        console.warn('🚫 [ROLE-GUARD] Rol insuficiente:', user.rol, 'vs', requiredRole);
        return router.createUrlTree(['/unauthorized']);
      }

      console.log('✅ [ROLE-GUARD] Acceso permitido');
      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      }));
    })
  );
};

// ==================== GUARD PARA ADMIN ====================

export const AdminGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('🛡️ [ADMIN-GUARD] Verificando acceso admin a:', state.url);

  // En SSR, permitir acceso
  if (!isPlatformBrowser(platformId)) {
    console.log('✅ [ADMIN-GUARD] SSR - Permitiendo acceso');
    return of(true);
  }

  return authService.waitForInitialization().pipe(
    timeout(5000),
    take(1),
    map(() => {
      const user = authService.currentUser;

      console.log('🛡️ [ADMIN-GUARD] Usuario actual:', user);

      if (!user) {
        console.warn('❌ [ADMIN-GUARD] No autenticado');
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      if (user.rol !== 'admin') {
        console.warn('🚫 [ADMIN-GUARD] Se requiere rol admin, tiene:', user.rol);
        return router.createUrlTree(['/unauthorized']);
      }

      console.log('✅ [ADMIN-GUARD] Acceso permitido');
      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      }));
    })
  );
};