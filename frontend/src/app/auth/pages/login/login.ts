// nuevo/frontend/src/app/auth/pages/login/login.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals para estado reactivo
  loading = signal(false);
  error = signal('');
  returnUrl = signal('/');

  // Formulario reactivo con validaciones
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn) {
      const user = this.authService.currentUser;
      console.log('✅ Ya está logueado como:', user?.email);
      this.navigateAfterLogin(user!);
      return;
    }

    // Obtener la URL de retorno de los query params
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
      }
    });
  }

  onSubmit(): void {
    this.error.set('');

    if (this.loginForm.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      this.markFormAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    // Deshabilitar el formulario mientras carga
    this.loading.set(true);
    this.loginForm.disable();

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.loginForm.enable();

        if (response.success && response.data) {
          console.log('✅ Login exitoso:', response.data.user.email);
          this.navigateAfterLogin(response.data.user);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.loginForm.enable();
        this.error.set(err.message || 'Error al iniciar sesión');
        console.error('❌ Error de login:', err);
      },
    });
  }

  private navigateAfterLogin(user: any): void {
    // Redirigir según el rol
    if (user.rol === 'usuario') {
      console.log('redirigiendo ')
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate([this.returnUrl()]);
    }
  }

  private markFormAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Helpers para el template
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
