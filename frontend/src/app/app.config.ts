// nuevo/frontend/src/app/app.config.ts
import {
  ApplicationConfig,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { provideClientHydration } from '@angular/platform-browser';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import MyPreset from './shared/mypreset';

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
      translation: {
        matchAll: 'Coincide con todos',
        matchAny: 'Coincide con cualquiera',
        dateAfter: 'Fecha posterior a',
        dateBefore: 'Fecha anterior a',
        startsWith: 'Comienza con',
        contains: 'Contiene',
        notContains: 'No contiene',
        endsWith: 'Termina con',
        equals: 'Igual a',
        notEquals: 'No es igual a',
        noFilter: 'Sin filtro',
        clear: 'Limpiar',
        apply: 'Aplicar',
        //matchMode: 'Modo de coincidencia',
        //first: 'Primero',
        //last: 'Último',
        //next: 'Siguiente',
        //previous: 'Anterior',
        emptyMessage: 'No hay resultados',
        emptyFilterMessage: 'Sin datos',
        //filter: 'Filtrar',
        //add: 'Añadir',
        //remove: 'Eliminar',
        cancel: 'Cancelar',
      },
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
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
