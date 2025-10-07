import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from './components/topbar/topbar';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Prueba } from './components/prueba/prueba';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Topbar, Navbar, Prueba],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sii');
}
