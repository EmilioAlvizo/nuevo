// frontend/src/app/core/services/platform.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private platformId = inject(PLATFORM_ID);
  
  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly isServer = !this.isBrowser;
}