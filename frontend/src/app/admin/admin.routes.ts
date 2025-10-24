import { Routes } from '@angular/router';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { SistemaJuventudesAdmin } from '../admin/pages/sistema-juventudes-admin/sistema-juventudes-admin';
import { EstadisticasAdmin } from '../admin/pages/estadisticas-admin/estadisticas-admin';
// import { RevistaVocesAdmin } from '../admin/pages/revista-voces-admin/revista-voces-admin';
import { CentroDocumentalAdmin } from '../admin/pages/centro-documental-admin/centro-documental-admin';
import { InformacionInteresAdmin } from '../admin/pages/informacion-interes-admin/informacion-interes-admin';


export const publicRoutes: Routes = [
  { path: '', component: HomeAdmin },
  { path: 'sistema-juventudes', component: SistemaJuventudesAdmin },
  { path: 'estadisticas', component: EstadisticasAdmin },
  // { path: 'revista', component: RevistaVocesAdmin },
  { path: 'centro-documental', component: CentroDocumentalAdmin },
  { path: 'informacion-interes', component: InformacionInteresAdmin },
];
