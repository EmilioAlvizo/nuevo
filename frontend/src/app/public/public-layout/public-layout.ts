import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../components/topbar/topbar';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { BotonContactanos } from '../components/boton-contactanos/boton-contactanos';

@Component({
  selector: 'public-layout',
  standalone: true,
  imports: [RouterOutlet, Topbar, Navbar, Footer, BotonContactanos],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.css'],
})
export class PublicLayoutComponent {}
