// nuevo/frontend/src/app/app.config.ts
import { ApplicationConfig, provideAppInitializer , provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors  } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

// ✅ Variable global para asegurar una sola ejecución
let authInitialized = false;

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideAppInitializer(() => {
      if (authInitialized) {
        return Promise.resolve();
      }
      authInitialized = true;
      
      const authService = inject(AuthService);
      return authService.initAuth();
    })
  ]
};