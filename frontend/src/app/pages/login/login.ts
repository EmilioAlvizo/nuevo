// nuevo/frontend/src/app/pages/login/login.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error = '';
  returnUrl = '/admin';

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Obtener la URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    
    // ✅ Verificar sesión de forma asíncrona
    this.authService.checkAuth().then(user => {
      if (user) {
        this.router.navigate([this.returnUrl]);
      }
    });
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        if (user) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.error = 'Credenciales inválidas';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al iniciar sesión';
        console.error('Error de login:', err);
      },
    });
  }
}