import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { BotonContactanos } from '../shared/boton-contactanos/boton-contactanos';

@Component({
  selector: 'public-layout',
  standalone: true,
  imports: [RouterOutlet, Topbar, Navbar, Footer, BotonContactanos],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.css'],
  encapsulation: ViewEncapsulation.None
})
export class PublicLayoutComponent {}
