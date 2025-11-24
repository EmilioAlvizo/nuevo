import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Topbar } from '../../shared/topbar/topbar';
import { NavbarAdmin } from '../components/navbar-admin/navbar-admin';
import { Footer } from '../../shared/footer/footer';
import { Navbar3 } from '../../public/components/navbar3/navbar3';

import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterOutlet, Footer, Navbar3],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayoutComponent {
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