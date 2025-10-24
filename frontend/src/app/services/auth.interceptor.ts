// nuevo/frontend/src/app/services/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ Inyección perezosa para evitar dependencia circular
  const router = inject(Router);

  // Clonar siempre con withCredentials
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error) => {
      // Si el token expiró o es inválido, redirigir al login
      if (error.status === 401 && !req.url.includes('/auth/verify')) {
        // ⚠️ No llamar authService.logout() - causa circular dependency
        // Solo redirigir
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};