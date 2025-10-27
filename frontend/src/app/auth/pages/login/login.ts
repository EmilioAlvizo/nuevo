// nuevo/frontend/src/app/auth/pages/login/login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  returnUrl = '/'; // Ruta por defecto después del login

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    // Validación básica
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.data) {
          console.log('✅ Login exitoso:', response.data.user.email);
          this.router.navigate(['/admin']);
          /* // Redirigir según el rol del usuario
          if (response.data.user.rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate([this.returnUrl]);
          } */
        } else {
          this.router.navigate([this.returnUrl]);
        }

      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Error al iniciar sesión';
        console.error('❌ Error de login:', err);
      },
    });
  }
}