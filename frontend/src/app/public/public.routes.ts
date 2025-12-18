// nuevo/frontend/src/app/public/public.routes.ts
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SistemaJuventudes } from './pages/sistema-juventudes/sistema-juventudes';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { RevistaVoces } from './pages/revista-voces/revista-voces';
import { RevistaDetalle } from './pages/revista-detalle/revista-detalle';
import { InformacionInteres } from './pages/informacion-interes/informacion-interes';
import { Directorio } from './pages/directorio/directorio';
import { Contactanos } from './pages/contactanos/contactanos';
import { Consejo } from './pages/consejo/consejo';
import { TemasInteres } from './pages/temas-interes/temas-interes';
import { ApoyosServicios } from './pages/apoyos-servicios/apoyos-servicios';

export const publicRoutes: Routes = [
  { path: '', component: Home, data: { ocultarDiv: false } },
  { path: 'sistema', component: SistemaJuventudes },
  { path: 'estadisticas', component: Estadisticas, data: { ocultarDiv: true } },
  { path: 'revista', component: RevistaVoces, data: { ocultarDiv: true } },
  { path: 'articulo/:id', component: RevistaDetalle },
  { path: 'revista/:id', component: RevistaDetalle, data: { ocultarDiv: true } },
  { path: 'informacion', component: InformacionInteres },
  { path: 'contactanos', component: Contactanos },
  { path: 'directorio-info', component: Directorio },
  { path: 'consejo', component: Consejo },
  { path: 'temas', component: TemasInteres },
  { path: 'apoyos', component: ApoyosServicios },
];
