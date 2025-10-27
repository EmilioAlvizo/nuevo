//nuevo/frontend/src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 [GUARD] Verificando acceso...');

  // ✅ ESPERAR a que termine la inicialización antes de decidir
  return authService.waitForInitialization().pipe(
    take(1),
    map(() => {
      const user = authService.currentUser;
      
      if (user) {
        console.log('🟢 [GUARD] Sesión válida, acceso permitido');
        return true;
      }

      console.warn('🔴 [GUARD] No hay sesión, redirigiendo a login');
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
