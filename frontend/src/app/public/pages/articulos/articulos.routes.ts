import { Routes } from '@angular/router';
import { Articulo2 } from '../../revista/1/articulo-2/articulo-2';

export const ARTICULOS_CHILD_ROUTES: Routes = [
  { path: '2', component: Articulo2 },
  // Aquí agregas más artículos:
  // { path: '3', component: Articulo3 },
  // { path: '4', component: Articulo4 },
];