// authorized-emails-admin.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import { ApiAuthorizedEmails, AuthorizedEmail } from '../../../core/services/authorized_emails';

@Component({
  selector: 'app-authorized-emails-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './authorized-emails-admin.html',
  styleUrl: './authorized-emails-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // IMPORTANTE: Soluciona el renderizado
})
export class AuthorizedEmailsAdmin implements OnInit, OnDestroy {
  // ===========================
  // INYECCIÓN DE DEPENDENCIAS
  // ===========================
  private apiEmails = inject(ApiAuthorizedEmails);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ===========================
  // STATE (SIGNALS)
  // ===========================
  emails = signal<AuthorizedEmail[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // Variables simples
  formEmail!: FormGroup;
  selectedEmailId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarEmails();  // ← llamado directo, sin setTimeout
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // FORMULARIO
  // ===========================
  private inicializarFormulario(): void {
    this.formEmail = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      used: [false],
    });
  }

  // ===========================
  // CARGA DE DATOS
  // ===========================
  cargarEmails(): void {
    this.loading.set(true); // Signal update

    this.apiEmails
      .getAuthorizedEmails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.emails.set(res.data); // Signal update dispara la vista
          } else {
            this.mostrarError('Error al cargar los emails autorizados');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar emails:', error);
          this.mostrarError('Error al cargar los emails autorizados. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // MODAL
  // ===========================
  abrirModal(email?: AuthorizedEmail): void {
    if (email) {
      this.editMode.set(true);
      this.selectedEmailId = email.id;

      this.formEmail.patchValue({
        email: email.email || '',
        used: email.used || false,
      });

    } else {
      this.editMode.set(false);
      this.selectedEmailId = null;
      this.formEmail.reset({ email: '', used: false });
    }

    this.modalVisible.set(true);
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    setTimeout(() => {
      this.vaciarFormulario();
    }, 200);
  }

  vaciarFormulario(): void {
    this.formEmail.reset({ email: '', used: false });
    this.editMode.set(false);
    this.selectedEmailId = null;
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      this.mostrarAdvertencia('Complete correctamente todos los campos.');
      return;
    }

    this.submitting.set(true);

    if (this.editMode() && this.selectedEmailId) {
      this.actualizarEmail();
    } else {
      this.crearEmail();
    }
  }

  private crearEmail(): void {
    const data = {
      email: this.formEmail.value.email?.trim(),
      authorized_by: 'admin',
    };

    this.apiEmails
      .createAuthorizedEmail(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email autorizado creado exitosamente');
            this.cargarEmails(); // Recargar lista
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el email');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          const mensaje = error.error?.message || 'Error al crear el email autorizado.';
          this.mostrarError(mensaje);
          this.submitting.set(false);
        },
      });
  }

  private actualizarEmail(): void {
    if (!this.selectedEmailId) return;

    const data = {
      email: this.formEmail.value.email?.trim(),
      used: this.formEmail.value.used,
    };

    this.apiEmails
      .updateAuthorizedEmail(this.selectedEmailId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email actualizado');
            this.cargarEmails();
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          const mensaje = error.error?.message || 'Error al actualizar el email autorizado.';
          this.mostrarError(mensaje);
          this.submitting.set(false);
        },
      });
  }


  toggleUsuarioActivo(email: AuthorizedEmail): void {
    if (!email.usuario_id) {
      this.mostrarAdvertencia('Este email no tiene usuario registrado');
      return;
    }

    const nuevoEstado = email.usuario_activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'inactivar';

    this.confirmationService.confirm({
      message: `¿Desea ${accion} al usuario "${email.usuario_nombre || email.email}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiEmails.updateUsuarioStatus(email.usuario_id!, nuevoEstado === 1)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.mostrarExito(res.message || 'Actualizado');
                this.cargarEmails();
              } else {
                this.mostrarError(res.message || 'Error al actualizar');
              }
            },
            error: () => {
              this.mostrarError('Error al actualizar el usuario');
            }
          });
      }
    });
  }


  // ===========================
  // ELIMINAR
  // ===========================
  // confirmarEliminar(email: AuthorizedEmail): void {
  //   this.confirmationService.confirm({
  //     message: `¿Desea ${accion} al usuario "${email.usuario_nombre || email.email}"?`,
  //     header: 'Confirmar',
  //     icon: 'pi pi-exclamation-triangle',
  //     acceptLabel: 'Sí, eliminar',
  //     rejectLabel: 'Cancelar',
  //     acceptButtonStyleClass: 'p-button-danger',
  //     accept: () => this.eliminarEmail(email.id),
  //   });
  // }

  private eliminarEmail(id: number): void {
    this.apiEmails
      .deleteAuthorizedEmail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Email eliminado correctamente');
            // Optimización: Actualizamos la lista localmente para no hacer otra petición (opcional)
            this.emails.update((current) => current.filter((e) => e.id !== id));
          } else {
            this.mostrarError(res.message || 'Error al eliminar');
          }
        },
        error: () => this.mostrarError('Error de red al eliminar'),
      });
  }

  // ===========================
  // HELPERS UI
  // ===========================
  hasError(fieldName: string): boolean {
    const field = this.formEmail.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.formEmail.get(fieldName);
    if (field?.errors?.['required']) return 'Este campo es requerido';
    if (field?.errors?.['email']) return 'Formato de email inválido';
    if (field?.errors?.['maxlength'])
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    return '';
  }

  // Mensajes (Wrappers simples)
  private mostrarExito(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail });
  }
  private mostrarError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
  private mostrarAdvertencia(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail });
  }
}
