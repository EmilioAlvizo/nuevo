import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SistemaJuventudes } from './pages/sistema-juventudes/sistema-juventudes';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { RevistaVoces } from './pages/revista-voces/revista-voces';
import { RevistaDetalle } from './pages/revista-detalle/revista-detalle';
import { CentroDocumental } from './pages/centro-documental/centro-documental';
import { InformacionInteres } from './pages/informacion-interes/informacion-interes';
import { Directorio } from './pages/directorio/directorio';
import { Contactanos } from './pages/contactanos/contactanos';


export const publicRoutes: Routes = [
  { path: '', component: Home },
  { path: 'sistema-juventudes', component: SistemaJuventudes },
  { path: 'estadisticas', component: Estadisticas },
  { path: 'revista', component: RevistaVoces },
  { path: 'revista/:id', component: RevistaDetalle},
  { path: 'centro-documental', component: CentroDocumental },
  { path: 'informacion-interes', component: InformacionInteres },
  { path: 'contactanos', component: Contactanos },
  { path: 'directorio', component: Directorio },
];
