// apoyos-servicios-admin.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { ApiApoyos, Apoyos } from '../../../core/services/apoyos_servicios';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-apoyos-servicios-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    AutoCompleteModule,
    SelectModule,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './apoyos-servicios-admin.html',
  styleUrl: './apoyos-servicios-admin.css',
})
export class ApoyosServiciosAdmin implements OnInit, OnDestroy {
  // Datos
  apoyos: Apoyos[] = [];
  
  // Formulario
  formApoyo!: FormGroup;
  
  // Control de modal
  modalVisible: boolean = false;
  editMode: boolean = false;
  selectedApoyoId: number | null = null;
  
  // Archivo
  selectedImage: File | null = null;
  allowedImageTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  maxFileSize: number = 5242880; // 5MB
  
  // Loading states
  loading: boolean = false;
  submitting: boolean = false;
  
  // Opciones de estatus
  estatusOptions: EstatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' }
  ];

  
  // Subject para manejar subscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private apiApoyos: ApiApoyos,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarApoyos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private inicializarFormulario(): void {
    this.formApoyo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      estatus: ['activo', [Validators.required]],
      link: ['', [Validators.maxLength(500)]],
      descripcion: ['', [Validators.maxLength(1000)]]
    });
  }

  /**
   * Carga todos los apoyos desde el API
   */
  cargarApoyos(): void {
    this.loading = true;
    this.apiApoyos.getApoyos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.apoyos = res.data || [];
          } else {
            this.mostrarError('Error al cargar los apoyos');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar apoyos:', error);
          this.mostrarError('Error al cargar los apoyos. Intente nuevamente.');
          this.loading = false;
        }
      });
  }

  /**
   * Abre el modal para crear o editar
   */
  abrirModal(apoyo?: Apoyos): void {
    if (apoyo) {
      this.editMode = true;
      this.selectedApoyoId = apoyo.id_apoyo;
      this.formApoyo.patchValue({
        nombre: apoyo.nombre || '',
        estatus: apoyo.estatus || 'A',
        link: apoyo.link || '',
        descripcion: apoyo.descripcion || ''
      });
    } else {
      this.editMode = false;
      this.selectedApoyoId = null;
    }
    
    this.modalVisible = true;
  }

  /**
   * Cierra el modal y limpia el estado
   */
  cerrarModal(): void {
    this.modalVisible = false;
    // Esperar a que la animación termine antes de limpiar
    setTimeout(() => {
      this.vaciarFormulario();
    }, 200);
  }

  /**
   * Limpia el formulario y reinicia el estado
   */
  vaciarFormulario(): void {
    this.formApoyo.reset({
      nombre: '',
      estatus: '',
      link: '',
      descripcion: ''
    });
    this.formApoyo.markAsPristine();
    this.formApoyo.markAsUntouched();
    this.editMode = false;
    this.selectedApoyoId = null;
    this.selectedImage = null;
  }

  /**
   * Maneja la selección de archivo con validaciones
   */
  onFileSelected(event: any): void {
    const file = event.target?.files?.[0] || event.files?.[0];
    
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    if (!this.allowedImageTypes.includes(file.type)) {
      this.mostrarAdvertencia('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP).');
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia(`El archivo excede el tamaño máximo permitido de ${this.maxFileSize / 1024 / 1024}MB.`);
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    this.selectedImage = file;
    this.mostrarExito(`Imagen "${file.name}" seleccionada correctamente.`);
  }

  /**
   * Envía el formulario (crear o actualizar)
   */
  submitForm(): void {
    // Validar formulario
    if (this.formApoyo.invalid) {
      this.formApoyo.markAllAsTouched();
      this.mostrarAdvertencia('Por favor complete todos los campos requeridos correctamente.');
      return;
    }

    // Validar imagen en modo creación
    if (!this.editMode && !this.selectedImage) {
      this.mostrarAdvertencia('Por favor seleccione una imagen.');
      return;
    }

    this.submitting = true;

    // Preparar FormData
    const formData = this.prepararFormData();

    if (this.editMode && this.selectedApoyoId) {
      this.actualizarApoyo(formData);
    } else {
      this.crearApoyo(formData);
    }
  }

  /**
   * Prepara el FormData con los datos del formulario
   */
  private prepararFormData(): FormData {
    const formData = new FormData();
    const formValues = this.formApoyo.value;

    formData.append('nombre', formValues.nombre?.trim() || '');
    formData.append('estatus', formValues.estatus || '');
    formData.append('link', formValues.link?.trim() || '');
    formData.append('descripcion', formValues.descripcion?.trim() || '');

    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage, this.selectedImage.name);
    }

    return formData;
  }

  /**
   * Crea un nuevo apoyo
   */
  private crearApoyo(formData: FormData): void {
    this.apiApoyos.createApoyo(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Apoyo creado exitosamente');
            
            // Agregar el nuevo apoyo a la lista o recargar
            if (res.data) {
              this.apoyos = [res.data, ...this.apoyos];
            } else {
              this.cargarApoyos();
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el apoyo');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear apoyo:', error);
          this.mostrarError('Error al crear el apoyo. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Actualiza un apoyo existente
   */
  private actualizarApoyo(formData: FormData): void {
    if (!this.selectedApoyoId) {
      this.mostrarError('No se ha seleccionado un apoyo para actualizar');
      this.submitting = false;
      return;
    }

    this.apiApoyos.updateApoyo(this.selectedApoyoId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Apoyo actualizado exitosamente');
            
            // Actualizar el apoyo en la lista local
            const index = this.apoyos.findIndex(a => a.id_apoyo === this.selectedApoyoId);
            if (index !== -1) {
              this.apoyos[index] = {
                ...this.apoyos[index],
                ...this.formApoyo.value,
                ...(res.data || {})
              };
              // Forzar detección de cambios
              this.apoyos = [...this.apoyos];
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el apoyo');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar apoyo:', error);
          this.mostrarError('Error al actualizar el apoyo. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Obtiene la URL completa de la imagen
   */
  getImageUrl(apoyo: Apoyos): string {
    if (!apoyo.imagen) {
      return '';
    }
    return `http://localhost:3000/public/apoyos_servicios/${apoyo.id_apoyo}/${apoyo.imagen}`;
  }

  /**
   * Obtiene el label del estatus
   */
  getEstatusLabel(estatus: string): string {
    const option = this.estatusOptions.find(opt => opt.value === estatus);
    return option?.label || estatus;
  }

  /**
   * Verifica si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const field = this.formApoyo.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.formApoyo.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
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