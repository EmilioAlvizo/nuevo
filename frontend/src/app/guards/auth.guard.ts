import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 AuthGuard activado');
  console.log('Token:', authService.getToken());
  console.log('Usuario:', authService.getCurrentUser());
  console.log('¿Autenticado?:', authService.isAuthenticated());

  if (authService.isAuthenticated()) {
    console.log('✅ Acceso permitido');
    return true;
  }

  console.log('❌ Acceso denegado - Redirigiendo a login');
  // Guardar la URL a la que intentaba acceder
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url }
  });
  return false;
};

// Guard para verificar roles
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('🔒 RoleGuard activado para roles:', allowedRoles);

    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado');
      router.navigate(['/login']);
      return false;
    }

    const user = authService.getCurrentUser();
    console.log('Usuario actual:', user);
    
    if (user && allowedRoles.includes(user.rol)) {
      console.log('✅ Rol permitido');
      return true;
    }

    console.log('❌ Rol no permitido');
    router.navigate(['/admin']);
    return false;
  };
};