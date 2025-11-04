// nuevo/frontend/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { AuthService } from './app/core/services/auth.service';

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));