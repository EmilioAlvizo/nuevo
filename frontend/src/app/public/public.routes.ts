// nuevo/frontend/src/app/public/public.routes.ts
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ARTICULOS_CHILD_ROUTES } from './pages/articulos/articulos.routes';
import { SistemaJuventudes } from './pages/sistema-juventudes/sistema-juventudes';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { RevistaVoces } from './pages/revista-voces/revista-voces';
import { RevistaDetalle } from './pages/revista-detalle/revista-detalle';
import { CentroDocumental } from './pages/centro-documental/centro-documental';
import { InformacionInteres } from './pages/informacion-interes/informacion-interes';
import { Directorio } from './pages/directorio/directorio';
import { Contactanos } from './pages/contactanos/contactanos';
import { Articulos } from './pages/articulos/articulos';
import { Consejo } from './pages/consejo/consejo';
import { TemasInteres } from './pages/temas-interes/temas-interes';
import { ApoyosServicios } from './pages/apoyos-servicios/apoyos-servicios';

export const publicRoutes: Routes = [
  { path: '', component: Home },
  { path: 'sistema', component: SistemaJuventudes },
  { path: 'estadisticas', component: Estadisticas },
  { path: 'revista', component: RevistaVoces },
  { path: 'revista/:id', component: RevistaDetalle },
  { path: 'revista/:id/articulo', component: Articulos, children: ARTICULOS_CHILD_ROUTES },
  { path: 'centro-documental', component: CentroDocumental },
  { path: 'informacion', component: InformacionInteres },
  { path: 'contactanos', component: Contactanos },
  { path: 'directorio-info', component: Directorio },
  { path: 'consejo', component: Consejo },
  { path: 'temas', component: TemasInteres},
  { path: 'apoyos', component: ApoyosServicios},
];
