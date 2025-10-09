import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Topbar } from './components/topbar/topbar';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Prueba } from './components/prueba/prueba';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Topbar, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sii');

  //esto es para ocultar el footer
  showFooter = true;
  showHeader = true;
  showTopBar = true;

  constructor(private router: Router) {
    // Escucha cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Rutas donde NO quieres mostrar el footer
        const hiddenFooterRoutes = ['/login', '/register', '/admin'];
        this.showFooter = !hiddenFooterRoutes.some(route => 
          event.url.includes(route)
        );

        // Rutas donde NO quieres mostrar el header
        const hiddenHeaderRoutes = ['/login', '/register'];
        this.showHeader = !hiddenHeaderRoutes.some(route => 
          event.url.includes(route)
        );

        // Rutas donde NO quieres mostrar el topbar
        const hiddenTopBarRoutes = ['/login', '/register'];
        this.showTopBar = !hiddenTopBarRoutes.some(route => 
          event.url.includes(route)
        );
      });
  }
}
