import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../shared/footer/footer';
import { Navbar3 } from '../components/navbar3/navbar3';
import { BotonContactanos } from '../components/boton-contactanos/boton-contactanos';

import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'public-layout',
  imports: [RouterOutlet, Footer, Navbar3],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.css'],
  encapsulation: ViewEncapsulation.None
})
export class PublicLayoutComponent {
  mostrarDiv = true;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.route;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        this.mostrarDiv = !currentRoute.snapshot.data['ocultarDiv'];
      });
  }
}
