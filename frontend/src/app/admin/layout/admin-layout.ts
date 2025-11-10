import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { NavbarAdmin } from '../components/navbar-admin/navbar-admin';
import { Footer } from '../../shared/footer/footer';
import { Navbar3 } from '../../public/components/navbar3/navbar3';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterOutlet, Footer, Navbar3],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayoutComponent {}