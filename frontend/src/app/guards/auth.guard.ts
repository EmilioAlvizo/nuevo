import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkAuth().pipe(
    map(user => {
      if (user) {
        console.log('✅ Acceso permitido');
        return true;
      } else {
        console.log('❌ Acceso denegado - Redirigiendo a login');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    }),
    catchError(err => {
      console.log('❌ Error de autenticación', err);
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};

// Guard para verificar roles
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.checkAuth().pipe(
      map(user => {
        if (!user) {
          router.navigate(['/login']);
          return false;
        }
        if (allowedRoles.includes(user.rol)) {
          return true;
        }
        router.navigate(['/admin']);
        return false;
      }),
      catchError(err => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
};