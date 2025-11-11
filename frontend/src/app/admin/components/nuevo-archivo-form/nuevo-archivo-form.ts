import {
  Component,
  output,
  input,
  model,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef,   // ✅ Importamos ChangeDetectorRef
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Archivos_municipio } from '../../../core/services/archivos_municipio';
import { Municipio } from '../../../core/services/municipios';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';

interface MunicipioOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-nuevo-archivo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    FileUploadModule,
    TagModule,
    AutoCompleteModule,
  ],
  templateUrl: './nuevo-archivo-form.html',
  styleUrl: './nuevo-archivo-form.css',
})
export class NuevoArchivoForm {
  private fb = new FormBuilder().nonNullable;
  private messageService = MessageService;

  constructor(private cdr: ChangeDetectorRef) {}  // ✅ Inyectamos ChangeDetectorRef

  @ViewChild('fileUploader') fileUploader: any;

  // Inputs
  visible = model.required<boolean>();
  municipios = input.required<Municipio[]>();
  isEditMode = input<boolean>(false);
  archivoToEdit = input<Archivos_municipio | null>(null);

  // Outputs
  visibleChange = output<boolean>();
  save = output<{ data: Partial<Archivos_municipio>; file: File | null }>();

  // Signals
  archivoSeleccionado = signal<File | null>(null);
  isSaving = signal<boolean>(false);

  municipiosOptions = computed<MunicipioOption[]>(() =>
    this.municipios().map((m) => ({
      label: m.nombre,
      value: m.id_municipio,
    }))
  );

  tiposArchivo = signal<string[]>([
    'Resultados',
    'Informe',
    'Reporte',
    'Documento',
    'Otro',
  ]);

  categorias = signal<string[]>([
    'Población',
    'Económica',
    'Social',
    'Ambiental',
    'Otro',
  ]);

  estatusOptions = signal<Array<{ label: string; value: 'A' | 'B' }>>([
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ]);

  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Archivo' : 'Nuevo Archivo Municipal'
  );

  archivoForm: FormGroup = this.fb.group({
    nombre_archivo: ['', [Validators.required, Validators.minLength(3)]],
    id_municipio: [null as number | null, [Validators.required]],
    tipo_archivo: ['', [Validators.required]],
    categoria_archivo: ['', [Validators.required]],
    subcategoria_archivo: [''],
    palabras_clave: [''],
    estatus_archivo: ['A', [Validators.required]],
    archivo: [null as File | null],
    fecha_archivo: [null, [Validators.required]],
  });

  // 🔄 Effect para cargar datos en modo edición
  ngOnInit(): void {
    effect(() => {
      const archivo = this.archivoToEdit();
      if (archivo && this.isEditMode()) {
        this.loadArchivoData(archivo);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.archivoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onArchivoSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.archivoForm.patchValue({ archivo: file });
      this.archivoForm.get('archivo')?.markAsTouched();

      if (!this.archivoForm.get('nombre_archivo')?.value) {
        const nombreSinExtension = file.name.split('.').slice(0, -1).join('.');
        this.archivoForm.patchValue({ nombre_archivo: nombreSinExtension });
      }
    }
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.archivoForm.patchValue({ archivo: null });
    this.archivoForm.get('archivo')?.markAsTouched();
  }

  handleSubmit(): void {
    Object.keys(this.archivoForm.controls).forEach((key) => {
      this.archivoForm.get(key)?.markAsTouched();
    });

    if (!this.isEditMode() && !this.archivoSeleccionado()) {
      this.archivoForm.get('archivo')?.setErrors({ required: true });
      return;
    }

    if (this.archivoForm.valid) {
      this.isSaving.set(true);
      const formData = this.archivoForm.getRawValue();
      this.save.emit({
        data: formData,
        file: this.archivoSeleccionado(),
      });
    }
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
    this.archivoForm.reset({
      estatus_archivo: 'A',
    });
    this.archivoSeleccionado.set(null);
    this.isSaving.set(false);

    if (this.fileUploader) {
      this.fileUploader.clear();
    }

    // 👇 Forzar detección tras reset
    this.cdr.detectChanges();
  }

  /** ✅ Cargar datos de archivo y refrescar selects */
  loadArchivoData(archivo: Archivos_municipio): void {
    this.archivoForm.patchValue({
      nombre_archivo: archivo.nombre_archivo,
      id_municipio: archivo.id_municipio,
      tipo_archivo: archivo.tipo_archivo,
      categoria_archivo: archivo.categoria_archivo,
      subcategoria_archivo: archivo.subcategoria_archivo || '',
      palabras_clave: archivo.palabras_clave || '',
      estatus_archivo: archivo.estatus_archivo,
      fecha_archivo: archivo.fecha_archivo ? archivo.fecha_archivo.split('T')[0] : null,
    });

    // 👇 Esperar un ciclo y refrescar los selects manualmente
    Promise.resolve().then(() => this.cdr.detectChanges());
  }

  getSeverity(estatus: string): 'success' | 'danger' {
    return estatus === 'A' ? 'success' : 'danger';
  }

  formatFileSize(bytes: number): string {
    return (bytes / 1024).toFixed(2) + ' KB';
  }

  public completeSave(): void {
    this.isSaving.set(false);
    this.resetForm();
    this.visibleChange.emit(false);
  }

  public cancelSave(): void {
    this.isSaving.set(false);
  }
}
