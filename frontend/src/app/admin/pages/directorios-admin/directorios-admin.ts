import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
// import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { ApiDirectorios, Directorios } from '../../../core/services/directorios';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-directorios-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    // InputTextareaModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './directorios-admin.html',
  styleUrl: './directorios-admin.css',
})
export class DirectoriosAdmin implements OnInit, OnDestroy {
  // Datos
  directorios: Directorios[] = [];
  
  // Formulario
  formDirectorio!: FormGroup;
  
  // Control de modal
  modalVisible: boolean = false;
  editMode: boolean = false;
  selectedDirectorioId: number | null = null;
  
  // Archivo
  selectedFile: File | null = null;
  allowedFileTypes: string[] = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  allowedFileExtensions: string[] = ['.pdf', '.xls', '.xlsx'];
  maxFileSize: number = 10485760; // 10MB
  
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
    private apiDirectorios: ApiDirectorios,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarDirectorios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private inicializarFormulario(): void {
    this.formDirectorio = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      estatus: ['A', [Validators.required]],
      descripcionMas: ['', [Validators.maxLength(1000)]]
    });
  }

  /**
   * Carga todos los directorios desde el API
   */
  cargarDirectorios(): void {
    this.loading = true;
    this.apiDirectorios.getDirectorios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.directorios = res.data || [];
          } else {
            this.mostrarError('Error al cargar los directorios');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar directorios:', error);
          this.mostrarError('Error al cargar los directorios. Intente nuevamente.');
          this.loading = false;
        }
      });
  }

  /**
   * Abre el modal para crear o editar
   */
  abrirModal(directorio?: Directorios): void {
    if (directorio) {
      this.editMode = true;
      this.selectedDirectorioId = directorio.id_directorio;
      this.formDirectorio.patchValue({
        descripcion: directorio.descripcion || '',
        estatus: directorio.estatus || 'A',
        descripcionMas: directorio.descripcionMas || ''
      });
    } else {
      this.editMode = false;
      this.selectedDirectorioId = null;
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
    this.formDirectorio.reset({
      descripcion: '',
      estatus: 'A',
      descripcionMas: ''
    });
    this.formDirectorio.markAsPristine();
    this.formDirectorio.markAsUntouched();
    this.editMode = false;
    this.selectedDirectorioId = null;
    this.selectedFile = null;
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
    if (!this.allowedFileTypes.includes(file.type)) {
      this.mostrarAdvertencia('Tipo de archivo no válido. Solo se permiten archivos PDF, XLS y XLSX.');
      this.selectedFile = null;
      event.target.value = '';
      return;
    }

    // Validar extensión del archivo
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedFileExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      this.mostrarAdvertencia('Extensión de archivo no válida. Solo se permiten .pdf, .xls y .xlsx.');
      this.selectedFile = null;
      event.target.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia(`El archivo excede el tamaño máximo permitido de ${this.maxFileSize / 1024 / 1024}MB.`);
      this.selectedFile = null;
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.mostrarExito(`Archivo "${file.name}" seleccionado correctamente.`);
  }

  /**
   * Envía el formulario (crear o actualizar)
   */
  submitForm(): void {
    // Validar formulario
    if (this.formDirectorio.invalid) {
      this.formDirectorio.markAllAsTouched();
      this.mostrarAdvertencia('Por favor complete todos los campos requeridos correctamente.');
      return;
    }

    // Validar archivo en modo creación
    if (!this.editMode && !this.selectedFile) {
      this.mostrarAdvertencia('Por favor seleccione un archivo (PDF o Excel).');
      return;
    }

    this.submitting = true;

    if (this.editMode && this.selectedDirectorioId) {
      this.actualizarDirectorio();
    } else {
      this.crearDirectorio();
    }
  }

  /**
   * Prepara el FormData con los datos del formulario
   */
  private prepararFormData(): FormData {
    const formData = new FormData();
    const formValues = this.formDirectorio.value;

    formData.append('descripcion', formValues.descripcion?.trim() || '');
    formData.append('estatus', formValues.estatus || 'A');
    formData.append('descripcionMas', formValues.descripcionMas?.trim() || '');

    if (this.selectedFile) {
      formData.append('archivo', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  /**
   * Crea un nuevo directorio
   */
  private crearDirectorio(): void {
    const formData = this.prepararFormData();
    
    this.apiDirectorios.createDirectorio(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Directorio creado exitosamente');
            
            if (res.data) {
              this.directorios = [res.data, ...this.directorios];
            } else {
              this.cargarDirectorios();
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear el directorio');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear directorio:', error);
          this.mostrarError('Error al crear el directorio. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Actualiza un directorio existente
   */
  private actualizarDirectorio(): void {
    if (!this.selectedDirectorioId) {
      this.mostrarError('No se ha seleccionado un directorio para actualizar');
      this.submitting = false;
      return;
    }

    const formData = this.prepararFormData();

    this.apiDirectorios.updateDirectorio(this.selectedDirectorioId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito(res.message || 'Directorio actualizado exitosamente');
            
            const index = this.directorios.findIndex(d => d.id_directorio === this.selectedDirectorioId);
            if (index !== -1) {
              this.directorios[index] = {
                ...this.directorios[index],
                ...this.formDirectorio.value,
                ...(res.data || {})
              };
              this.directorios = [...this.directorios];
            }
            
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar el directorio');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar directorio:', error);
          this.mostrarError('Error al actualizar el directorio. Intente nuevamente.');
          this.submitting = false;
        }
      });
  }

  /**
   * Obtiene la URL completa del archivo
   */
  getFileUrl(directorio: Directorios): string {
    if (!directorio.link) {
      return '';
    }
    return `http://localhost:3000/public/directorios/${directorio.id_directorio}/${directorio.link}`;
  }

  /**
   * Obtiene el icono según el tipo de archivo
   */
  getFileIcon(directorio: Directorios): string {
    if (!directorio.link) {
      return 'pi pi-file';
    }
    const fileName = directorio.link.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return 'pi pi-file-pdf';
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return 'pi pi-file-excel';
    }
    return 'pi pi-file';
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
    const field = this.formDirectorio.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.formDirectorio.get(fieldName);
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