import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Validaciones
    if (!this.nombre || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    const userData = {
      nombre: this.nombre,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/admin']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Error al registrar usuario';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
