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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { ApiTemas, Temas } from '../../../core/services/temas_interes';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-temas-interes-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
    TagModule,
    TextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './temas-interes-admin.html',
  styleUrl: './temas-interes-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // SOLUCIÓN AL RENDERIZADO
})
export class TemasInteresAdmin implements OnInit, OnDestroy {
  // ===========================
  // INYECCIONES
  // ===========================
  private apiTemas = inject(ApiTemas);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ===========================
  // ESTADO (SIGNALS)
  // ===========================
  temas = signal<Temas[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Modal State
  modalVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // ===========================
  // VARIABLES LOCALES
  // ===========================
  formTema!: FormGroup;
  selectedTemaId: number | null = null;

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
    this.cargarTemas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // FORMULARIO
  // ===========================
  private inicializarFormulario(): void {
    this.formTema = this.fb.group({
      descripcionTema: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
      ],
      estatusTema: ['A', [Validators.required]],
      link: ['', [Validators.maxLength(500)]],
      descripcionMas: ['', [Validators.maxLength(1000)]],
    });
  }

  // ===========================
  // CARGA DE DATOS
  // ===========================
  cargarTemas(): void {
    this.loading.set(true);

    this.apiTemas
      .getTemas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.temas.set(res.data || []);
          } else {
            this.mostrarError('Error al cargar los temas');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar temas:', error);
          this.mostrarError('Error al cargar los temas. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // MODAL LOGIC
  // ===========================
  abrirModal(tema?: Temas): void {
    if (tema) {
      this.editMode.set(true);
      this.selectedTemaId = tema.id_tema;
      this.formTema.patchValue({
        descripcionTema: tema.descripcionTema || '',
        estatusTema: tema.estatusTema || 'A',
        link: tema.link || '',
        descripcionMas: tema.descripcionMas || '',
      });
    } else {
      this.editMode.set(false);
      this.selectedTemaId = null;
      this.formTema.reset({ estatusTema: 'A' });
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
    this.formTema.reset({
      descripcionTema: '',
      estatusTema: 'A',
      link: '',
      descripcionMas: '',
    });
    this.formTema.markAsPristine();
    this.formTema.markAsUntouched();
    this.editMode.set(false);
    this.selectedTemaId = null;
    this.selectedImage = null;
  }

  // ===========================
  // ARCHIVO
  // ===========================
  onFileSelected(event: any): void {
    const file = event.target?.files?.[0] || event.files?.[0];

    if (!file) return;

    // Validaciones
    if (!this.allowedImageTypes.includes(file.type)) {
      this.mostrarAdvertencia('Tipo de archivo no válido. Solo imágenes (JPG, PNG, GIF, WEBP).');
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
    // No necesitamos un signal aquí a menos que mostremos el nombre del archivo en la UI y falle el refresco
    // Pero OnPush a veces requiere forzar si es una variable local simple mostrada en template.
    // En este caso, el input file muestra su propio valor nativo, así que suele estar bien.
    this.mostrarExito(`Imagen "${file.name}" seleccionada.`);
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formTema.invalid) {
      this.formTema.markAllAsTouched();
      this.mostrarAdvertencia('Complete los campos requeridos.');
      return;
    }

    // Validación extra para imagen en modo creación
    if (!this.editMode() && !this.selectedImage) {
      this.mostrarAdvertencia('Por favor seleccione una imagen.');
      return;
    }

    this.submitting.set(true);
    const formData = this.prepararFormData();

    if (this.editMode() && this.selectedTemaId) {
      this.actualizarTema(formData);
    } else {
      this.crearTema(formData);
    }
  }

  private prepararFormData(): FormData {
    const formData = new FormData();
    const v = this.formTema.value;

    formData.append('descripcionTema', v.descripcionTema?.trim() || '');
    formData.append('estatusTema', v.estatusTema || 'A');
    formData.append('link', v.link?.trim() || '');
    formData.append('descripcionMas', v.descripcionMas?.trim() || '');

    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage, this.selectedImage.name);
    }

    return formData;
  }

  // ===========================
  // CRUD
  // ===========================
  private crearTema(formData: FormData): void {
    this.apiTemas
      .createTema(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Tema creado exitosamente');

            // Actualización optimista o basada en respuesta (Inmutable)
            if (res.data) {
              this.temas.update((current) => [res.data, ...current]);
            } else {
              this.cargarTemas();
            }
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el tema');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error create:', error);
          this.mostrarError('Error al crear el tema.');
          this.submitting.set(false);
        },
      });
  }

  private actualizarTema(formData: FormData): void {
    if (!this.selectedTemaId) return;

    this.apiTemas
      .updateTema(this.selectedTemaId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Tema actualizado exitosamente');

            // Actualización Inmutable Local (Evita parpadeo de recarga)
            this.temas.update((current) =>
              current.map((t) =>
                t.id_tema === this.selectedTemaId
                  ? { ...t, ...this.formTema.value, ...(res.data || {}) }
                  : t
              )
            );

            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error update:', error);
          this.mostrarError('Error al actualizar el tema.');
          this.submitting.set(false);
        },
      });
  }

  // ===========================
  // HELPERS
  // ===========================
  getImageUrl(tema: Temas): string {
    if (!tema.imagen) return '';
    // Idealmente mover URL base a environment.ts
    return `http://localhost:3000/public/temas_interes/${tema.id_tema}/${tema.imagen}`;
  }

  getEstatusLabel(estatus: string): string {
    return estatus === 'A' ? 'Activo' : 'Inactivo';
  }

  // Validaciones UI
  hasError(field: string): boolean {
    const control = this.formTema.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.formTema.get(field);
    if (control?.errors?.['required']) return 'Campo requerido';
    if (control?.errors?.['minlength'])
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control?.errors?.['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return '';
  }

  // Mensajes Wrapper
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
