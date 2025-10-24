// nuevo/frontend/src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // ✅ Esperar a que checkAuth() termine (ya sea inicial o nueva verificación)
    const user = await authService.checkAuth();
    
    if (user) {
      return true;
    } else {
      console.log('🔒 Acceso denegado - Se requiere autenticación');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  } catch (error) {
    console.error('❌ Error en authGuard:', error);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};

// Guard para verificar roles
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    try {
      const user = await authService.checkAuth();
      
      if (!user) {
        console.log('❌ No autenticado');
        router.navigate(['/login']);
        return false;
      }
      
      if (allowedRoles.includes(user.rol)) {
        console.log('✅ Rol permitido:', user.rol);
        return true;
      }
      
      console.log('❌ Rol no permitido. Requerido:', allowedRoles, 'Actual:', user.rol);
      router.navigate(['/admin']);
      return false;
    } catch (error) {
      console.error('❌ Error en roleGuard:', error);
      router.navigate(['/login']);
      return false;
    }
  };
};