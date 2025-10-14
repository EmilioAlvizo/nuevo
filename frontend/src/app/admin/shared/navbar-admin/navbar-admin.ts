import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar-admin',
  imports: [],
  templateUrl: './navbar-admin.html',
  styleUrl: './navbar-admin.css'
})
export class NavbarAdmin {
  //funcion para cerrar cesion usando el servicio authservice
  constructor(private authService: AuthService) {

  }
  logout(): void {
    this.authService.logout();
  }

}
