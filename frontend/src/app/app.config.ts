// nuevo/frontend/src/app/app.config.ts
import {
  ApplicationConfig,
  provideAppInitializer,
  provideZoneChangeDetection,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { IMAGE_LOADER, ImageLoaderConfig, IMAGE_CONFIG } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { bootstrapApplication, provideClientHydration, withEventReplay, withIncrementalHydration, } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

import { providePrimeNG } from 'primeng/config';
import MyPreset from './stylePrimeng';
//import Lara from '@primeuix/themes/lara';

// ✅ Variable global para asegurar una sola ejecución
let authInitialized = false;

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        // Tu URL base del servidor
        const baseUrl = environment.publicUrl;
        return `${baseUrl}${config.src}`;
      },
    },
    {
      provide: IMAGE_CONFIG,
      useValue: {
        placeholderResolution: 40, // Para placeholders de mejor calidad
      }
    },
    provideClientHydration(withEventReplay(),withIncrementalHydration()),
    //provideZoneChangeDetection({ eventCoalescing: true }),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
      },
    }),
    //provideRouter(routes),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
    }),),
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
