// apoyos-servicios-admin.component.ts
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
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { ApiApoyos, Apoyos } from '../../../core/services/apoyos_servicios';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-apoyos-servicios-admin',
  // standalone: true, // Es default en Angular moderno
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './apoyos-servicios-admin.html',
  styleUrl: './apoyos-servicios-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // CLAVE PARA SOLUCIONAR EL RENDERIZADO
})
export class ApoyosServiciosAdmin implements OnInit, OnDestroy {
  // ===========================
  // INYECCIÓN DE DEPENDENCIAS
  // ===========================
  private apiApoyos = inject(ApiApoyos);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ===========================
  // ESTADO (SIGNALS)
  // ===========================
  apoyos = signal<Apoyos[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Estado UI
  modalVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // ===========================
  // VARIABLES LOCALES
  // ===========================
  formApoyo!: FormGroup;
  selectedApoyoId: number | null = null;

  // Archivo
  selectedImage: File | null = null;
  allowedImageTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  maxFileSize: number = 5 * 1024 * 1024; // 5MB

  estatusOptions: EstatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];

  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarApoyos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // FORMULARIO
  // ===========================
  private inicializarFormulario(): void {
    this.formApoyo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      estatus: ['A', [Validators.required]], // Corregido valor default a 'A'
      link: ['', [Validators.maxLength(500)]],
      descripcion: ['', [Validators.maxLength(1000)]],
    });
  }

  // ===========================
  // CARGA DE DATOS
  // ===========================
  cargarApoyos(): void {
    this.loading.set(true); // Signal

    this.apiApoyos
      .getApoyos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.apoyos.set(res.data || []); // Signal dispara la vista
          } else {
            this.mostrarError('Error al cargar los apoyos');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar apoyos:', error);
          this.mostrarError('Error al cargar los apoyos. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // MODAL
  // ===========================
  abrirModal(apoyo?: Apoyos): void {
    if (apoyo) {
      this.editMode.set(true);
      this.selectedApoyoId = apoyo.id_apoyo;
      this.formApoyo.patchValue({
        nombre: apoyo.nombre || '',
        estatus: apoyo.estatus || 'A',
        link: apoyo.link || '',
        descripcion: apoyo.descripcion || '',
      });
    } else {
      this.editMode.set(false);
      this.selectedApoyoId = null;
      this.formApoyo.reset({ estatus: 'A' });
      this.selectedImage = null;
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
    this.formApoyo.reset({
      nombre: '',
      estatus: 'A',
      link: '',
      descripcion: '',
    });
    this.formApoyo.markAsPristine();
    this.formApoyo.markAsUntouched();
    this.editMode.set(false);
    this.selectedApoyoId = null;
    this.selectedImage = null;
  }

  // ===========================
  // ARCHIVO
  // ===========================
  onFileSelected(event: any): void {
    const file = event.target?.files?.[0] || event.files?.[0];

    if (!file) return;

    if (!this.allowedImageTypes.includes(file.type)) {
      this.mostrarAdvertencia('Tipo de archivo no válido. Solo se permiten imágenes.');
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia(`El archivo excede el tamaño máximo permitido de 5MB.`);
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    this.selectedImage = file;
    this.mostrarExito(`Imagen "${file.name}" seleccionada.`);
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formApoyo.invalid) {
      this.formApoyo.markAllAsTouched();
      this.mostrarAdvertencia('Complete los campos requeridos.');
      return;
    }

    if (!this.editMode() && !this.selectedImage) {
      this.mostrarAdvertencia('Por favor seleccione una imagen.');
      return;
    }

    this.submitting.set(true);
    const formData = this.prepararFormData();

    if (this.editMode() && this.selectedApoyoId) {
      this.actualizarApoyo(formData);
    } else {
      this.crearApoyo(formData);
    }
  }

  private prepararFormData(): FormData {
    const formData = new FormData();
    const v = this.formApoyo.value;

    formData.append('nombre', v.nombre?.trim() || '');
    formData.append('estatus', v.estatus || 'A');
    formData.append('link', v.link?.trim() || '');
    formData.append('descripcion', v.descripcion?.trim() || '');

    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage, this.selectedImage.name);
    }

    return formData;
  }

  // ===========================
  // CRUD
  // ===========================
  private crearApoyo(formData: FormData): void {
    this.apiApoyos
      .createApoyo(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Apoyo creado exitosamente');

            // Actualización optimista o inmutable
            if (res.data) {
              this.apoyos.update((curr) => [res.data, ...curr]);
            } else {
              this.cargarApoyos();
            }
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el apoyo');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al crear apoyo:', error);
          this.mostrarError('Error al crear el apoyo. Intente nuevamente.');
          this.submitting.set(false);
        },
      });
  }

  private actualizarApoyo(formData: FormData): void {
    if (!this.selectedApoyoId) return;

    this.apiApoyos
      .updateApoyo(this.selectedApoyoId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Apoyo actualizado exitosamente');

            // Actualización local
            this.apoyos.update((curr) =>
              curr.map((a) =>
                a.id_apoyo === this.selectedApoyoId
                  ? { ...a, ...this.formApoyo.value, ...(res.data || {}) }
                  : a
              )
            );

            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el apoyo');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar apoyo:', error);
          this.mostrarError('Error al actualizar el apoyo. Intente nuevamente.');
          this.submitting.set(false);
        },
      });
  }

  // ===========================
  // HELPERS UI
  // ===========================
  getImageUrl(apoyo: Apoyos): string {
    if (!apoyo.imagen) return '';
    return `http://localhost:3000/public/apoyos_servicios/${apoyo.id_apoyo}/${apoyo.imagen}`;
  }

  getEstatusLabel(estatus: string): string {
    return estatus === 'A' ? 'Activo' : 'Inactivo';
  }

  hasError(field: string): boolean {
    const control = this.formApoyo.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.formApoyo.get(field);
    if (control?.errors?.['required']) return 'Este campo es requerido';
    if (control?.errors?.['minlength'])
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control?.errors?.['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return '';
  }

  // Wrappers de mensajes
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
