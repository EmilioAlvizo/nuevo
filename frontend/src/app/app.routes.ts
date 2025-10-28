// import { Routes } from '@angular/router';
// import { Home } from './public/pages/home/home';
// import { SistemaJuventudes } from './pages/sistema-juventudes/sistema-juventudes';
// import { Estadisticas } from './pages/estadisticas/estadisticas';
// import { RevistaVoces } from './pages/revista-voces/revista-voces';
// import { CentroDocumental } from './pages/centro-documental/centro-documental';
// import { InformacionInteres } from './pages/informacion-interes/informacion-interes';
// import { LoginComponent } from './pages/login/login';
// import { RegisterComponent } from './pages/register/register';
// import { Contactanos } from './public/components/contactanos/contactanos';

// export const routes: Routes = [
//     {path: '', component: Home},
//     {path: 'sistema-juventudes', component: SistemaJuventudes},
//     {path: 'estadisticas', component: Estadisticas},
//     {path: 'revista', component: RevistaVoces},
//     {path: 'centro-documental', component: CentroDocumental},
//     {path: 'informacion-interes', component: InformacionInteres},
//     {path: 'login',component: LoginComponent},
//     {path: 'register',component: RegisterComponent},
//     {path: 'contactanos', component: Contactanos},
// ];

// nuevo/frontend/src/app/app.routes.ts
// nuevo/frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public/layout/public-layout';
import { AdminLayoutComponent } from './admin/layout/admin-layout';
import { LoginComponent } from './auth/pages/login/login';
import { RegisterComponent } from './auth/pages/register/register';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./public/public.routes').then(m => m.publicRoutes),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard], 
    children: [
      {
        path: '',
        loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes), // Corregí el nombre
      }
    ],
    runGuardsAndResolvers: 'always',
  },
  // Rutas públicas de autenticación
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  // Ruta para usuarios no autorizados (opcional)
  /*{
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },*/
  // Ruta 404
];