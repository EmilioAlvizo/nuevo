//nuevo/frontend/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned).pipe(
    catchError(err => {
      // ✅ No redirigir si es una petición de verify o refresh
      // Estas rutas manejan su propia lógica de autenticación
      const isAuthEndpoint = req.url.includes('/auth/verify') || 
                             req.url.includes('/auth/refresh') ||
                             req.url.includes('/auth/login');

      if (err.status === 401 && !isAuthEndpoint) {
        console.log('🔒 401 Unauthorized detected by interceptor.');
        console.warn('⚠️ No autorizado, redirigiendo a /login');
        router.navigate(['/login']);
      }
      
      return throwError(() => err);
    })
  );
};