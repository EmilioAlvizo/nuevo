// nuevo/frontend/src/app/core/guards/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, timeout, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TimeoutError } from 'rxjs';

export const AuthGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('🛡️ [GUARD] Verificando acceso a:', state.url);
  console.log('🛡️ [GUARD] Platform:', isPlatformBrowser(platformId) ? 'Browser' : 'Server');

  // ✅ En SSR, siempre permitir acceso y dejar que el cliente maneje la autenticación
  if (!isPlatformBrowser(platformId)) {
    console.log('✅ [GUARD] SSR - Permitiendo acceso (se validará en el cliente)');
    return of(true);
  }

  // ✅ En el navegador, verificar autenticación normalmente
  console.log('🛡️ [GUARD] Estado actual de usuario:', authService.currentUser);

  return authService.waitForInitialization().pipe(
    timeout(5000),
    take(1),
    map(() => {
      console.log('✅ [GUARD] Inicialización completada');
      const user = authService.currentUser;

      if (user) {
        const requiredRole = route.data['role'] as string | undefined;

        if (requiredRole && user.rol !== requiredRole) {
          console.warn('🚫 [GUARD] Rol insuficiente. Requerido:', requiredRole, 'Actual:', user.rol);
          return router.createUrlTree(['/unauthorized']);
        }

        console.log('✅ [GUARD] Acceso permitido para:', user.email);
        return true;
      }

      console.warn('❌ [GUARD] No autenticado, redirigiendo a login');
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }),
    catchError((error) => {
      console.error('❌ [GUARD] Error en autenticación:', error.message);
      // En caso de timeout u otro error, redirigir a login
      return of(router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
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