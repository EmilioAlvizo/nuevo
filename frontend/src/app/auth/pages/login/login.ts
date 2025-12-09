// nuevo/frontend/src/app/auth/pages/login/login.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true, // Asegúrate de que tu app soporte standalone o quítalo si usas Módulos
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals locales
  loading = signal(false);
  error = signal('');
  returnUrl = signal('/');

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    // CORRECCIÓN: Usar paréntesis () para leer las signals del servicio
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUser();
      console.log('✅ Ya está logueado como:', user?.email);
      this.navigateAfterLogin(user);
      return;
    }

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

    this.loading.set(true);
    this.loginForm.disable();

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.loginForm.enable();

        if (response.success && response.data) {
          this.navigateAfterLogin(response.data.user);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.loginForm.enable();
        // Manejo seguro del mensaje de error
        const msg = err.error?.message || err.message || 'Error al iniciar sesión';
        this.error.set(msg);
      },
    });
  }

  private navigateAfterLogin(user: any): void {
    if (user?.rol === 'usuario') { // Safe navigation operator por si acaso
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

  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }
}