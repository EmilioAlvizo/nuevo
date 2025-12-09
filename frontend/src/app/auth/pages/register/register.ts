// nuevo/frontend/src/app/pages/register/register.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals
  loading = signal(false);
  error = signal('');

  // Formulario Reactivo
  registerForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  onSubmit(): void {
    this.error.set('');

    if (this.registerForm.invalid) {
      this.error.set('Por favor corrige los errores en el formulario');
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nombre, email, password, confirmPassword } = this.registerForm.getRawValue();
    const userData = { nombre, email, password, confirmPassword };

    this.loading.set(true);
    this.registerForm.disable();

    // Asumiendo que tu AuthService tiene un método register que devuelve un Observable
    this.authService.register(userData).subscribe({
      next: (response: any) => { 
        // Ajusta 'response' según lo que devuelva tu backend en registro
        this.loading.set(false);
        this.registerForm.enable();
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.registerForm.enable();
        const msg = err.error?.message || 'Error al registrar usuario';
        this.error.set(msg);
      }
    });
  }

  // Validador personalizado para contraseñas
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Getters para el HTML
  get f() { return this.registerForm.controls; }
}