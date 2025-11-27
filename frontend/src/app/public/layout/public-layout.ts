import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { Navbar3 } from '../components/navbar3/navbar3';
import { BotonContactanos } from '../components/boton-contactanos/boton-contactanos';


@Component({
  selector: 'public-layout',
  imports: [RouterOutlet, Footer, Navbar3],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.css'],
  encapsulation: ViewEncapsulation.None
})
export class PublicLayoutComponent {
}
