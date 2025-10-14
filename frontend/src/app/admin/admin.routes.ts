import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SistemaJuventudes } from '../admin/pages/sistema-juventudes/sistema-juventudes';
import { Estadisticas } from '../admin/pages/estadisticas/estadisticas';
import { RevistaVoces } from '../admin/pages/revista-voces/revista-voces';
import { CentroDocumental } from '../admin/pages/centro-documental/centro-documental';
import { InformacionInteres } from '../admin/pages/informacion-interes/informacion-interes';


export const publicRoutes: Routes = [
  { path: 'admin', component: Home },
  { path: 'sistema-juventudes', component: SistemaJuventudes },
  { path: 'estadisticas', component: Estadisticas },
  { path: 'revista', component: RevistaVoces },
  { path: 'centro-documental', component: CentroDocumental },
  { path: 'informacion-interes', component: InformacionInteres },
];
