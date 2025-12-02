// nuevo/frontend/src/app/app.config.ts
import {
  ApplicationConfig,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { provideClientHydration } from '@angular/platform-browser';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import MyPreset from './stylePrimeng';
//import Lara from '@primeuix/themes/lara';

// ✅ Variable global para asegurar una sola ejecución
let authInitialized = false;

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
      },
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    //provideRouter(routes),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
    }),),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      if (authInitialized) {
        return Promise.resolve();
      }
      authInitialized = true;

      const authService = inject(AuthService);
      return authService.initAuth();
    }),
    
  ],
};
