import { Component, OnInit, OnDestroy } from '@angular/core';
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
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './authorized-emails-admin.html',
  styleUrl: './authorized-emails-admin.css',
})
export class AuthorizedEmailsAdmin implements OnInit, OnDestroy {

  emails: AuthorizedEmail[] = [];
  formEmail!: FormGroup;

  modalVisible = false;
  editMode = false;
  selectedEmailId: number | null = null;

  loading = false;
  submitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private apiEmails: ApiAuthorizedEmails,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarEmails();  // ← llamado directo, sin setTimeout
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {
    this.formEmail = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      used: [false]
    });
  }

  cargarEmails(): void {
    this.loading = true;

    this.apiEmails.getAuthorizedEmails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.emails = res.data;
          } else {
            this.mostrarError('Error al cargar los emails autorizados');
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar emails:', err);
          this.mostrarError('Error al cargar los emails autorizados.');
          this.loading = false;
        }
      });
  }

  abrirModal(email?: AuthorizedEmail): void {
    if (email) {
      this.editMode = true;
      this.selectedEmailId = email.id;

      this.formEmail.patchValue({
        email: email.email,
        used: email.used
      });

    } else {
      this.editMode = false;
      this.selectedEmailId = null;
      this.formEmail.reset({ email: '', used: false });
    }

    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.vaciarFormulario();
  }

  vaciarFormulario(): void {
    this.formEmail.reset({
      email: '',
      used: false
    });
    this.formEmail.markAsPristine();
    this.formEmail.markAsUntouched();
    this.editMode = false;
    this.selectedEmailId = null;
  }

  submitForm(): void {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      this.mostrarAdvertencia('Complete correctamente todos los campos.');
      return;
    }

    this.submitting = true;

    if (this.editMode && this.selectedEmailId) {
      this.actualizarEmail();
    } else {
      this.crearEmail();
    }
  }

  private crearEmail(): void {
    const data = {
      email: this.formEmail.value.email.trim(),
      authorized_by: 'admin'
    };

    this.apiEmails.createAuthorizedEmail(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email creado exitosamente');
            this.cargarEmails();
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el email');
          }
          this.submitting = false;
        },
        error: (err) => {
          console.error(err);
          this.mostrarError('Error al crear el email');
          this.submitting = false;
        }
      });
  }

  private actualizarEmail(): void {
    const data = {
      email: this.formEmail.value.email.trim(),
      used: this.formEmail.value.used
    };

    this.apiEmails.updateAuthorizedEmail(this.selectedEmailId!, data)
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
          this.submitting = false;
        },
        error: (err) => {
          console.error(err);
          this.mostrarError('Error al actualizar email');
          this.submitting = false;
        }
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

  hasError(field: string): boolean {
    const f = this.formEmail.get(field);
    return !!(f && f.invalid && (f.touched || f.dirty));
  }

  getErrorMessage(field: string): string {
    const f = this.formEmail.get(field);
    if (!f || !f.errors) return '';

    if (f.errors['required']) return 'Campo requerido';
    if (f.errors['email']) return 'Email inválido';
    if (f.errors['maxlength']) return `Máximo ${f.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // Mensajes PrimeNG
  mostrarExito(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  mostrarError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
  }

  mostrarAdvertencia(msg: string) {
    this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: msg });
  }
}
