import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { AuthService } from './app/core/services/auth.service';

// Esperar a que Angular inyecte los providers antes del bootstrap
async function main() {
  const appRef = await bootstrapApplication(App, appConfig);

  // ✅ Inicia la verificación de sesión al arrancar
  const injector = appRef.injector;
  const authService = injector.get(AuthService);
  authService['initAuth'](); // llama al método privado
}

main().catch(err => console.error(err));