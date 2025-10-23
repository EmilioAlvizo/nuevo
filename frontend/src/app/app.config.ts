// nuevo/frontend/src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { AuthService } from './services/auth.service';
import { firstValueFrom } from 'rxjs';

// ✅ Función que verifica la sesión ANTES de iniciar la app
export function initializeAuth(authService: AuthService) {
  return () => {
    console.log('🔄 Verificando sesión al iniciar...');
    return firstValueFrom(authService.checkAuth()).then(user => {
      if (user) {
        console.log('✅ Sesión activa:', user.nombre);
      } else {
        console.log('ℹ️ No hay sesión activa');
      }
    }).catch(err => {
      console.error('❌ Error verificando sesión:', err);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // ✅ Inicializar autenticación antes de cargar la app
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    }
  ]
};