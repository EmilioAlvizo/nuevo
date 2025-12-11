// nuevo/frontend/src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { SistemaJuventudesAdmin } from '../admin/pages/sistema-juventudes-admin/sistema-juventudes-admin';
import { RevistaVocesAdmin } from '../admin/pages/revista-voces-admin/revista-voces-admin';
import { CentroDocumentalAdmin } from '../admin/pages/centro-documental-admin/centro-documental-admin';
import { InformacionInteresAdmin } from '../admin/pages/informacion-interes-admin/informacion-interes-admin';
import { TemasInteresAdmin } from './pages/temas-interes-admin/temas-interes-admin';
import { TestimoniosAdmin } from './pages/testimonios-admin/testimonios-admin';
import { PropuestasAccionAdmin } from './pages/propuestas-accion-admin/propuestas-accion-admin';
import { BancoDatosAdmin } from './pages/banco-datos-admin/banco-datos-admin';
import { ArticulosAdmin } from './pages/articulos-admin/articulos-admin';
import { FileManagerComponent } from './pages/file-manager.component/file-manager.component';
import { ArchivosMunicipiosAdmin } from './pages/archivos-municipios-admin/archivos-municipios-admin';
import { DocumentosCendocAdmin } from './pages/documentos-cendoc-admin/documentos-cendoc-admin';
import { ConsejoAdmin  } from './pages/consejo-admin/consejo-admin';
import { DirectoriosAdmin } from './pages/directorios-admin/directorios-admin';
import { ApoyosServiciosAdmin } from './pages/apoyos-servicios-admin/apoyos-servicios-admin';
import { AuthorizedEmailsAdmin } from './pages/authorized-emails-admin/authorized-emails-admin';
import { EncuestasAdmin } from './pages/encuestas-admin/encuestas-admin';
import { InterfazAdmin } from './pages/interfaz-admin/interfaz-admin';

export const adminRoutes: Routes = [
  { path: '', component: HomeAdmin },
  { path: 'sistema-juventudes', component: SistemaJuventudesAdmin },
  { path: 'revista', component: RevistaVocesAdmin },
  { path: 'centro-documental', component: CentroDocumentalAdmin },
  { path: 'informacion-interes', component: InformacionInteresAdmin },
  { path: 'temas-interes', component: TemasInteresAdmin },
  { path: 'testimonios', component: TestimoniosAdmin },
  { path: 'propuestas-accion', component: PropuestasAccionAdmin},
  { path: 'banco-datos', component: BancoDatosAdmin},
  { path: 'articulos', component: ArticulosAdmin},
  { path: 'file-manager', component: FileManagerComponent},
  { path: 'archivos-municipio', component: ArchivosMunicipiosAdmin},
  { path: 'documentos-cendoc', component: DocumentosCendocAdmin},
  { path: 'consejo', component: ConsejoAdmin },
  { path: 'directorios', component: DirectoriosAdmin},
  { path: 'apoyos', component: ApoyosServiciosAdmin},
  { path: 'usuarios-autorizados', component: AuthorizedEmailsAdmin},
  { path: 'encuestas', component: EncuestasAdmin },
  { path: 'interfaz', component: InterfazAdmin }
];
