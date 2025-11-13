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
  templateUrl: './temas-interes-admin.html',
  styleUrl: './temas-interes-admin.css',
})
export class TemasInteresAdmin implements OnInit, OnDestroy {
  // Datos
  temas: Temas[] = [];
  
  // Formulario
  formTema!: FormGroup;
  
  // Control de modal
  modalVisible: boolean = false;
  editMode: boolean = false;
  selectedTemaId: number | null = null;
  
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
    private apiTemas: ApiTemas,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarTemas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private inicializarFormulario(): void {
    this.formTema = this.fb.group({
      descripcionTema: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      estatusTema: ['A', [Validators.required]],
      link: ['', [Validators.maxLength(500)]],
      descripcionMas: ['', [Validators.maxLength(1000)]]
    });
  }

  /**
   * Carga todos los temas desde el API
   */
  cargarTemas(): void {
    this.loading = true;
    this.apiTemas.getTemas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.temas = res.data || [];
          } else {
            this.mostrarError('Error al cargar los temas');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar temas:', error);
          this.mostrarError('Error al cargar los temas. Intente nuevamente.');
          this.loading = false;
        }
      });
  }

  /**
   * Abre el modal para crear o editar
   */
  abrirModal(tema?: Temas): void {
    if (tema) {
      this.editMode = true;
      this.selectedTemaId = tema.id_tema;
      this.formTema.patchValue({
        descripcionTema: tema.descripcionTema || '',
        estatusTema: tema.estatusTema || 'A',
        link: tema.link || '',
        descripcionMas: tema.descripcionMas || ''
      });
    } else {
      this.editMode = false;
      this.selectedTemaId = null;
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
    this.formTema.reset({
      descripcionTema: '',
      estatusTema: 'A',
      link: '',
      descripcionMas: ''
    });
    this.formTema.markAsPristine();
    this.formTema.markAsUntouched();
    this.editMode = false;
    this.selectedTemaId = null;
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
    if (this.formTema.invalid) {
      this.formTema.markAllAsTouched();
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

    if (this.editMode && this.selectedTemaId) {
      this.actualizarTema(formData);
    } else {
      this.crearTema(formData);
    }
  }

  /**
   * Prepara el FormData con los datos del formulario
   */
  private prepararFormData(): FormData {
    const formData = new FormData();
    const formValues = this.formTema.value;

    formData.append('descripcionTema', formValues.descripcionTema?.trim() || '');
    formData.append('estatusTema', formValues.estatusTema || 'A');
    formData.append('link', formValues.link?.trim() || '');
    formData.append('descripcionMas', formValues.descripcionMas?.trim() || '');

    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage, this.selectedImage.name);
    }

    return formData;
  }

  /**
   * Crea un nuevo tema
   */
  private crearTema(formData: FormData): void {
    this.apiTemas.createTema(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Tema creado exitosamente');
            
            // Agregar el nuevo tema a la lista o recargar
            if (res.data) {
              this.temas = [res.data, ...this.temas];
            } else {
              this.cargarTemas();
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el tema');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear tema:', error);
          this.mostrarError('Error al crear el tema. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Actualiza un tema existente
   */
  private actualizarTema(formData: FormData): void {
    if (!this.selectedTemaId) {
      this.mostrarError('No se ha seleccionado un tema para actualizar');
      this.submitting = false;
      return;
    }

    this.apiTemas.updateTema(this.selectedTemaId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Tema actualizado exitosamente');
            
            // Actualizar el tema en la lista local
            const index = this.temas.findIndex(t => t.id_tema === this.selectedTemaId);
            if (index !== -1) {
              this.temas[index] = {
                ...this.temas[index],
                ...this.formTema.value,
                ...(res.data || {})
              };
              // Forzar detección de cambios
              this.temas = [...this.temas];
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el tema');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar tema:', error);
          this.mostrarError('Error al actualizar el tema. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Obtiene la URL completa de la imagen
   */
  getImageUrl(tema: Temas): string {
    if (!tema.imagen) {
      return '';
    }
    return `http://localhost:3000/public/temas_interes/${tema.id_tema}/${tema.imagen}`;
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
    const field = this.formTema.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.formTema.get(fieldName);
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