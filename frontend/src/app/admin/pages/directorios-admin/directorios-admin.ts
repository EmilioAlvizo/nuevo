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
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import { ApiDirectorios, Directorios } from '../../../core/services/directorios';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-directorios-admin',
  // standalone: true, // Default en Angular v19+
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './directorios-admin.html',
  styleUrl: './directorios-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // SOLUCIÓN DE RENDERIZADO
})
export class DirectoriosAdmin implements OnInit, OnDestroy {
  // ===========================
  // INYECCIÓN DE DEPENDENCIAS
  // ===========================
  private apiDirectorios = inject(ApiDirectorios);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ===========================
  // ESTADO (SIGNALS)
  // ===========================
  directorios = signal<Directorios[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // UI State
  modalVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // ===========================
  // VARIABLES LOCALES
  // ===========================
  formDirectorio!: FormGroup;
  selectedDirectorioId: number | null = null;

  // Archivo
  selectedFile: File | null = null;
  // Tipos MIME permitidos
  allowedFileTypes: string[] = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  // Extensiones permitidas (validación secundaria)
  allowedFileExtensions: string[] = ['.pdf', '.xls', '.xlsx'];
  maxFileSize: number = 10 * 1024 * 1024; // 10MB

  estatusOptions: EstatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];

  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarDirectorios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // FORMULARIO
  // ===========================
  private inicializarFormulario(): void {
    this.formDirectorio = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      estatus: ['A', [Validators.required]],
      descripcionMas: ['', [Validators.maxLength(1000)]],
    });
  }

  // ===========================
  // CARGA DE DATOS
  // ===========================
  cargarDirectorios(): void {
    this.loading.set(true); // Signal

    this.apiDirectorios
      .getDirectorios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.directorios.set(res.data || []); // Signal dispara la vista
          } else {
            this.mostrarError('Error al cargar los directorios');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar directorios:', error);
          this.mostrarError('Error al cargar los directorios. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // MODAL
  // ===========================
  abrirModal(directorio?: Directorios): void {
    if (directorio) {
      this.editMode.set(true);
      this.selectedDirectorioId = directorio.id_directorio;
      this.formDirectorio.patchValue({
        descripcion: directorio.descripcion || '',
        estatus: directorio.estatus || 'A',
        descripcionMas: directorio.descripcionMas || '',
      });
    } else {
      this.editMode.set(false);
      this.selectedDirectorioId = null;
      this.formDirectorio.reset({ estatus: 'A' });
      this.selectedFile = null;
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
    this.formDirectorio.reset({
      descripcion: '',
      estatus: 'A',
      descripcionMas: '',
    });
    this.formDirectorio.markAsPristine();
    this.formDirectorio.markAsUntouched();
    this.editMode.set(false);
    this.selectedDirectorioId = null;
    this.selectedFile = null;
  }

  // ===========================
  // ARCHIVO
  // ===========================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    if (!this.allowedFileTypes.includes(file.type)) {
      this.mostrarAdvertencia(
        'Tipo de archivo no válido. Solo se permiten archivos PDF, XLS y XLSX.'
      );
      this.selectedFile = null;
      input.value = '';
      return;
    }

    // Validar extensión del archivo (doble check)
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedFileExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      this.mostrarAdvertencia('Extensión de archivo no válida.');
      this.selectedFile = null;
      input.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia(`El archivo excede el tamaño máximo de 10MB.`);
      this.selectedFile = null;
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.mostrarExito(`Archivo "${file.name}" seleccionado.`);
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formDirectorio.invalid) {
      this.formDirectorio.markAllAsTouched();
      this.mostrarAdvertencia('Complete los campos requeridos.');
      return;
    }

    if (!this.editMode() && !this.selectedFile) {
      this.mostrarAdvertencia('Por favor seleccione un archivo (PDF o Excel).');
      return;
    }

    this.submitting.set(true);
    const formData = this.prepararFormData();

    if (this.editMode() && this.selectedDirectorioId) {
      this.actualizarDirectorio(formData);
    } else {
      this.crearDirectorio(formData);
    }
  }

  private prepararFormData(): FormData {
    const formData = new FormData();
    const v = this.formDirectorio.value;

    formData.append('descripcion', v.descripcion?.trim() || '');
    formData.append('estatus', v.estatus || 'A');
    formData.append('descripcionMas', v.descripcionMas?.trim() || '');

    if (this.selectedFile) {
      formData.append('archivo', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  // ===========================
  // CRUD
  // ===========================
  private crearDirectorio(formData: FormData): void {
    this.apiDirectorios
      .createDirectorio(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Directorio creado exitosamente');

            if (res.data) {
              // Actualización inmutable
              this.directorios.update((curr) => [res.data, ...curr]);
            } else {
              this.cargarDirectorios();
            }
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el directorio');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error create:', error);
          this.mostrarError('Error al crear el directorio. Intente nuevamente.');
          this.submitting.set(false);
        },
      });
  }

  private actualizarDirectorio(formData: FormData): void {
    if (!this.selectedDirectorioId) return;

    this.apiDirectorios
      .updateDirectorio(this.selectedDirectorioId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Directorio actualizado exitosamente');

            // Actualización inmutable
            this.directorios.update((curr) =>
              curr.map((d) =>
                d.id_directorio === this.selectedDirectorioId
                  ? { ...d, ...this.formDirectorio.value, ...(res.data || {}) }
                  : d
              )
            );

            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el directorio');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error update:', error);
          this.mostrarError('Error al actualizar el directorio.');
          this.submitting.set(false);
        },
      });
  }

  // ===========================
  // HELPERS UI
  // ===========================
  getFileUrl(directorio: Directorios): string {
    if (!directorio.link) return '';
    return `http://localhost:3000/public/directorios/${directorio.id_directorio}/${directorio.link}`;
  }

  getFileIcon(directorio: Directorios): string {
    if (!directorio.link) return 'pi pi-file';
    const fileName = directorio.link.toLowerCase();
    if (fileName.endsWith('.pdf')) return 'pi pi-file-pdf text-red-500';
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx'))
      return 'pi pi-file-excel text-green-500';
    return 'pi pi-file';
  }

  getEstatusLabel(estatus: string): string {
    return estatus === 'A' ? 'Activo' : 'Inactivo';
  }

  hasError(field: string): boolean {
    const control = this.formDirectorio.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.formDirectorio.get(field);
    if (control?.errors?.['required']) return 'Este campo es requerido';
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
