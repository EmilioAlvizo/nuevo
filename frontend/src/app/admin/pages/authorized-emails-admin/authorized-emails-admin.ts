// authorized-emails-admin.component.ts

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
  // Datos
  emails: AuthorizedEmail[] = [];
  
  // Formulario
  formEmail!: FormGroup;
  
  // Control de modal
  modalVisible: boolean = false;
  editMode: boolean = false;
  selectedEmailId: number | null = null;
  
  // Loading states
  loading: boolean = false;
  submitting: boolean = false;
  
  // Subject para manejar subscripciones
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
    this.cargarEmails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private inicializarFormulario(): void {
    this.formEmail = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      used: [false]
    });
  }

  /**
   * Carga todos los emails desde el API
   */
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
        error: (error) => {
          console.error('Error al cargar emails:', error);
          this.mostrarError('Error al cargar los emails autorizados. Intente nuevamente.');
          this.loading = false;
        }
      });
  }

  /**
   * Abre el modal para crear o editar
   */
  abrirModal(email?: AuthorizedEmail): void {
    if (email) {
      this.editMode = true;
      this.selectedEmailId = email.id;
      this.formEmail.patchValue({
        email: email.email || '',
        used: email.used || false
      });
    } else {
      this.editMode = false;
      this.selectedEmailId = null;
    }
    
    this.modalVisible = true;
  }

  /**
   * Cierra el modal y limpia el estado
   */
  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => {
      this.vaciarFormulario();
    }, 200);
  }

  /**
   * Limpia el formulario y reinicia el estado
   */
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

  /**
   * Envía el formulario (crear o actualizar)
   */
  submitForm(): void {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      this.mostrarAdvertencia('Por favor complete todos los campos requeridos correctamente.');
      return;
    }

    this.submitting = true;

    if (this.editMode && this.selectedEmailId) {
      this.actualizarEmail();
    } else {
      this.crearEmail();
    }
  }

  /**
   * Crea un nuevo email autorizado
   */
  private crearEmail(): void {
    const data = {
      email: this.formEmail.value.email?.trim(),
      authorized_by: 'admin'
    };

    this.apiEmails.createAuthorizedEmail(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email autorizado creado exitosamente');
            this.cargarEmails();
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el email autorizado');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear email:', error);
          const mensaje = error.error?.message || 'Error al crear el email autorizado. Intente nuevamente.';
          this.mostrarError(mensaje);
          this.submitting = false;
        }
      });
  }

  /**
   * Actualiza un email autorizado existente
   */
  private actualizarEmail(): void {
    if (!this.selectedEmailId) {
      this.mostrarError('No se ha seleccionado un email para actualizar');
      this.submitting = false;
      return;
    }

    const data = {
      email: this.formEmail.value.email?.trim(),
      used: this.formEmail.value.used
    };

    this.apiEmails.updateAuthorizedEmail(this.selectedEmailId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email autorizado actualizado exitosamente');
            this.cargarEmails();
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el email autorizado');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar email:', error);
          const mensaje = error.error?.message || 'Error al actualizar el email autorizado. Intente nuevamente.';
          this.mostrarError(mensaje);
          this.submitting = false;
        }
      });
  }

  /**
   * Confirma y elimina un email
   */
  confirmarEliminar(email: AuthorizedEmail): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el email "${email.email}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarEmail(email.id);
      }
    });
  }

  /**
   * Elimina un email
   */
  private eliminarEmail(id: number): void {
    this.apiEmails.deleteAuthorizedEmail(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Email autorizado eliminado exitosamente');
            this.cargarEmails();
          } else {
            this.mostrarError(res.message || 'Error al eliminar el email autorizado');
          }
        },
        error: (error) => {
          console.error('Error al eliminar email:', error);
          this.mostrarError('Error al eliminar el email autorizado. Intente nuevamente.');
        }
      });
  }

  /**
   * Verifica si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const field = this.formEmail.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.formEmail.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['email']) {
      return 'El formato del email no es válido';
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  // === MÉTODOS DE MENSAJES ===

  private mostrarExito(mensaje: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje,
      life: 3000
    });
  }

  private mostrarError(mensaje: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje,
      life: 5000
    });
  }

  private mostrarAdvertencia(mensaje: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: mensaje,
      life: 4000
    });
  }
}