import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SistemaJuventudes } from './pages/sistema-juventudes/sistema-juventudes';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { RevistaVoces } from './pages/revista-voces/revista-voces';
import { CentroDocumental } from './pages/centro-documental/centro-documental';
import { InformacionInteres } from './pages/informacion-interes/informacion-interes';
import { Contactanos } from './components/contactanos/contactanos';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'sistema-juventudes', component: SistemaJuventudes},
    {path: 'estadisticas', component: Estadisticas},
    {path: 'revista', component: RevistaVoces},
    {path: 'centro-documental', component: CentroDocumental},
    {path: 'informacion-interes', component: InformacionInteres},
    {path: 'contactanos', component: Contactanos},
];