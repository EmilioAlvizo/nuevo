// import { Component, signal } from '@angular/core';
// import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
// import { filter } from 'rxjs/operators';
// import { Topbar } from './public/components/topbar/topbar';
// import { Navbar } from './public/components/navbar/navbar';
// import { Footer } from './public/components/footer/footer';
// import { BotonContactanos } from './public/components/boton-contactanos/boton-contactanos';


// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet, Footer, Topbar, Navbar, BotonContactanos],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App {
//   protected readonly title = signal('sii');

//   //esto es para ocultar el footer
//   showFooter = true;
//   showHeader = true;
//   showTopBar = true;

//   constructor(private router: Router) {
//     // Escucha cambios de ruta
//     this.router.events
//       .pipe(filter(event => event instanceof NavigationEnd))
//       .subscribe((event: any) => {
//         // Rutas donde NO quieres mostrar el footer
//         const hiddenFooterRoutes = ['/login', '/register', '/admin'];
//         this.showFooter = !hiddenFooterRoutes.some(route => 
//           event.url.includes(route)
//         );

//         // Rutas donde NO quieres mostrar el header
//         const hiddenHeaderRoutes = ['/login', '/register'];
//         this.showHeader = !hiddenHeaderRoutes.some(route => 
//           event.url.includes(route)
//         );

//         // Rutas donde NO quieres mostrar el topbar
//         const hiddenTopBarRoutes = ['/login', '/register'];
//         this.showTopBar = !hiddenTopBarRoutes.some(route => 
//           event.url.includes(route)
//         );
//       });
//   }
// }

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App {}
