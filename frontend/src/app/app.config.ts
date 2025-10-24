// nuevo/frontend/src/app/app.config.ts
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch()
    ),
    // ✅ Inicialización que ESPERA a que termine la verificación
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      
      try {
        await authService.initialize();
        const user = authService.getCurrentUser();
        if (user) {
          console.log('✅ Sesión activa:', user.nombre);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
      }
    })
  ]
};