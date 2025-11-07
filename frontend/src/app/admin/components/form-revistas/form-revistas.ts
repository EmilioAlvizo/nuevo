// nuevo/frontend/src/app/admin/components/form-revistas/form-revistas.ts
import {
  Component,
  signal,
  input,
  output,
  ViewChild,
  computed,
  effect,
  model,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-form-revistas',
  imports: [
    DialogModule,
    TagModule,
    ButtonModule,
    AutoCompleteModule,
    ReactiveFormsModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
  ],
  templateUrl: './form-revistas.html',
  styleUrl: './form-revistas.css',
})
export class FormRevistas {
  private fb = new FormBuilder().nonNullable;

  @ViewChild('portadaUploader') portadaUploader: any;
  @ViewChild('archivoUploader') archivoUploader: any;

  // Inputs usando model y input
  visible = model.required<boolean>();
  isEditMode = input<boolean>(false);
  revistaToEdit = input<any>(null);

  // Outputs
  visibleChange = output<boolean>();
  save = output<FormData>();

  // Signals
  portadaSeleccionada = signal<File | null>(null);
  portadaPreview = signal<string | null>(null);
  archivoSeleccionado = signal<File | null>(null);
  archivoNombre = signal<string | null>(null);
  isSaving = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);

  // Computed signals
  dialogTitle = computed(() => (this.isEditMode() ? 'Editar Revista' : 'Agregar Revista'));

  estatusOptions = signal<EstatusOption[]>([
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'I' },
  ]);

  // Form
  revistaForm: FormGroup;

  // 🔥 Variable para evitar recargas múltiples
  private lastLoadedRevistaId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.revistaForm = this.fb.group({
      volumen: [null as number | null, [Validators.required, Validators.min(1)]],
      numero_year: [null as number | null, [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.required, Validators.maxLength(250)]],
      fecha: [null as Date | null, [Validators.required]],
      estatus: [null as string | null, [Validators.required]],
      portadaFile: [null as File | null],
      archivoFile: [null as File | null],
    });

    // 🔥 Effect optimizado: solo se ejecuta cuando cambia la revista Y el diálogo se abre
    effect(() => {
      const revista = this.revistaToEdit();
      const isVisible = this.visible();
      const isEdit = this.isEditMode();
      
      // Solo cargar si:
      // 1. El diálogo está visible
      // 2. Es modo edición
      // 3. Hay una revista
      // 4. Es una revista diferente a la última cargada
      if (isVisible && isEdit && revista && revista.id_revista !== this.lastLoadedRevistaId) {
        console.log('🔄 Effect: Cargando revista', revista.id_revista);
        this.lastLoadedRevistaId = revista.id_revista;
        this.loadRevistaData(revista);
      } else if (isVisible && !isEdit) {
        // Si se abre en modo crear, limpiar el ID
        this.lastLoadedRevistaId = null;
      } else if (!isVisible) {
        // Si se cierra el diálogo, resetear el ID
        this.lastLoadedRevistaId = null;
      }
    });
  }

  // 👇 MÉTODO ACTUALIZADO siguiendo el patrón de PrimeNG
  isFieldInvalid(fieldName: string): boolean {
    const field = this.revistaForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitted()));
  }

  // 🔥 NUEVO: Método para manejar cambios en el estatus
  onEstatusChange(event: any): void {
    console.log('🔄 Estatus cambiado a:', event.value);
    // Actualizar el formulario explícitamente
    this.revistaForm.patchValue({ estatus: event.value });
    this.revistaForm.get('estatus')?.markAsTouched();
    this.revistaForm.get('estatus')?.markAsDirty();
  }

  onPortadaSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.portadaSeleccionada.set(file);
      this.revistaForm.patchValue({ portadaFile: file });
      this.revistaForm.get('portadaFile')?.markAsTouched();

      // Generar preview
      const reader = new FileReader();
      reader.onload = () => {
        this.portadaPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onPortadaRemove(): void {
    this.portadaSeleccionada.set(null);
    this.portadaPreview.set(null);
    this.revistaForm.patchValue({ portadaFile: null });
    this.revistaForm.get('portadaFile')?.markAsTouched();
  }

  onArchivoSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.archivoNombre.set(file.name);
      this.revistaForm.patchValue({ archivoFile: file });
      this.revistaForm.get('archivoFile')?.markAsTouched();
    }
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.revistaForm.patchValue({ archivoFile: null });
    this.revistaForm.get('archivoFile')?.markAsTouched();
  }

  handleSubmit(): void {
    // 👇 Marcar que el formulario fue enviado
    this.formSubmitted.set(true);
    
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.revistaForm.controls).forEach((key) => {
      this.revistaForm.get(key)?.markAsTouched();
    });

    // Validaciones adicionales para archivos (solo en crear)
    if (!this.isEditMode()) {
      if (!this.portadaSeleccionada()) {
        this.revistaForm.get('portadaFile')?.setErrors({ required: true });
      }
      if (!this.archivoSeleccionado()) {
        this.revistaForm.get('archivoFile')?.setErrors({ required: true });
      }
    }

    if (this.revistaForm.valid) {
      this.isSaving.set(true);
      const formData = this.buildFormData();
      this.save.emit(formData);
    }
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.revistaForm.getRawValue();

    // Agregar campos básicos
    if (formValue.volumen) formData.append('volumen', String(formValue.volumen));
    if (formValue.numero_year) formData.append('numero_year', String(formValue.numero_year));
    if (formValue.descripcion) formData.append('descripcion', formValue.descripcion);
    if (formValue.fecha) {
      const fechaLocal =
        formValue.fecha instanceof Date ? formValue.fecha : new Date(formValue.fecha);

      // 📅 Convertir a formato local con hora (sin pasar por UTC)
      const año = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      const horas = String(fechaLocal.getHours()).padStart(2, '0');
      const minutos = String(fechaLocal.getMinutes()).padStart(2, '0');
      const segundos = String(fechaLocal.getSeconds()).padStart(2, '0');

      // 🕓 Formato completo local
      const fechaHoraLocal = `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

      console.log('📅 Fecha local enviada:', fechaHoraLocal);

      formData.append('fecha', fechaHoraLocal);
    }
    if (formValue.estatus) formData.append('estatus', formValue.estatus);

    // Agregar archivos si existen
    if (this.portadaSeleccionada()) {
      formData.append('portada', this.portadaSeleccionada()!);
    }
    if (this.archivoSeleccionado()) {
      formData.append('archivo', this.archivoSeleccionado()!);
    }

    // Si es edición, agregar el ID
    if (this.isEditMode() && this.revistaToEdit()?.id_revista) {
      formData.append('id_revista', String(this.revistaToEdit().id_revista));
    }

    return formData;
  }

  handleCancel(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  handleDialogHide(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  resetForm(): void {
    this.revistaForm.reset({
      estatus: 'A',
    });
    this.portadaSeleccionada.set(null);
    this.portadaPreview.set(null);
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.isSaving.set(false);
    this.formSubmitted.set(false);
    this.lastLoadedRevistaId = null; // 👈 RESETEAR el ID

    if (this.portadaUploader) {
      this.portadaUploader.clear();
    }
    if (this.archivoUploader) {
      this.archivoUploader.clear();
    }
  }

  loadRevistaData(revista: any): void {
    console.log('📋 Cargando revista:', revista.id_revista);
    
    // 👇 Cargar los valores directamente sin timeout
    this.revistaForm.patchValue({
      volumen: revista.volumen,
      numero_year: revista.numero_year,
      descripcion: revista.descripcion,
      fecha: revista.fecha ? new Date(revista.fecha) : null,
      estatus: revista.estatus,
    });
    
    console.log('✅ Formulario después de cargar:', this.revistaForm.value);
    console.log('✅ Estatus cargado:', this.revistaForm.get('estatus')?.value);
    
    // Marcar como pristine después de cargar
    this.revistaForm.markAsPristine();
    this.revistaForm.markAsUntouched();

    // Limpiar archivos seleccionados al cargar datos
    this.portadaSeleccionada.set(null);
    this.portadaPreview.set(null);
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.formSubmitted.set(false);
  }

  getSeverity(estatus: string): 'success' | 'danger' {
    return estatus === 'A' ? 'success' : 'danger';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Métodos públicos para ser llamados desde el padre
  public completeSave(): void {
    this.isSaving.set(false);
    this.resetForm();
    this.visibleChange.emit(false);
  }

  public cancelSave(): void {
    this.isSaving.set(false);
  }

  // Getter para acceso rápido a controles (compatible con template)
  get f() {
    return this.revistaForm.controls;
  }
}