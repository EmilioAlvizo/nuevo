import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../../public/components/topbar/topbar';
import { NavbarAdmin } from '../components/navbar-admin/navbar-admin';
import { Footer } from '../../public/components/footer/footer';


@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterOutlet, Topbar, NavbarAdmin, Footer],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayoutComponent {}