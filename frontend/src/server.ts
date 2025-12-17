// nuevo/frontend/src/server.ts
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * NO uses wildcards, solo pasa el middleware directamente
 */
app.use((req, res, next) => {
  // Solo procesa requests HTML (no archivos estáticos)
  if (req.path.includes('.')) {
    return next();
  }

  //console.log('🔍 SSR Request:', req.originalUrl || req.url);
  
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        //console.log('✅ SSR Success:', req.originalUrl || req.url);
        writeResponseToNodeResponse(response, res);
      } else {
        console.warn('⚠️ No response from Angular:', req.originalUrl || req.url);
        next();
      }
      return;
    })
    .catch((error) => {
      console.error('❌ SSR Error:', req.originalUrl || req.url, error.message);
      next(error);
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    //console.log(`🚀 Node Express server listening on http://localhost:${port}`);
    //console.log(`📝 SSR is enabled. All routes will be server-rendered.`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
