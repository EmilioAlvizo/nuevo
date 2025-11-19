// nuevo/frontend/src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { SistemaJuventudesAdmin } from '../admin/pages/sistema-juventudes-admin/sistema-juventudes-admin';
import { EstadisticasAdmin } from '../admin/pages/estadisticas-admin/estadisticas-admin';
import { RevistaVocesAdmin } from '../admin/pages/revista-voces-admin/revista-voces-admin';
import { CentroDocumentalAdmin } from '../admin/pages/centro-documental-admin/centro-documental-admin';
import { InformacionInteresAdmin } from '../admin/pages/informacion-interes-admin/informacion-interes-admin';
import { TemasInteresAdmin } from './pages/temas-interes-admin/temas-interes-admin';
import { TestimoniosAdmin } from './pages/testimonios-admin/testimonios-admin';
import { PropuestasAccionAdmin } from './pages/propuestas-accion-admin/propuestas-accion-admin';
import { BancoDatosAdmin } from './pages/banco-datos-admin/banco-datos-admin';
import { ArticulosAdmin } from './pages/articulos-admin/articulos-admin';


export const adminRoutes: Routes = [
  { path: '', component: HomeAdmin },
  { path: 'sistema-juventudes', component: SistemaJuventudesAdmin },
  { path: 'estadisticas', component: EstadisticasAdmin },
  { path: 'revista', component: RevistaVocesAdmin },
  { path: 'centro-documental', component: CentroDocumentalAdmin },
  { path: 'informacion-interes', component: InformacionInteresAdmin },
  { path: 'temas-interes', component: TemasInteresAdmin },
  { path: 'testimonios', component: TestimoniosAdmin },
  { path: 'propuestas-accion', component: PropuestasAccionAdmin},
  { path: 'banco-datos', component: BancoDatosAdmin},
  { path: 'articulos', component: ArticulosAdmin}
];
