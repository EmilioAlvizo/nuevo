// nuevo/frontend/src/app/admin/components/nuevo-archivo-form/nuevo-archivo-form.ts
import {
  Component,
  model,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ApiArchivos_municipio,
  Archivos_municipio,
} from '../../../core/services/archivos_municipio';
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
import { DatePickerModule } from 'primeng/datepicker';

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
    DatePickerModule,
  ],
  providers: [DatePipe],
  templateUrl: './nuevo-archivo-form.html',
  styleUrl: './nuevo-archivo-form.css',
})
export class NuevoArchivoForm {
  // === DI using inject() ===
  private fb = new FormBuilder().nonNullable;
  private messageService = inject(MessageService);
  private apiArchivos = inject(ApiArchivos_municipio);
  private datePipe = inject(DatePipe);

  // ViewChild reference to PrimeNG FileUpload component
  @ViewChild('fileUploader') fileUploader: any;

  // Inputs (signals)
  visible = model.required<boolean>();
  municipios = input.required<Municipio[]>();
  isEditMode = input<boolean>(false);
  archivoToEdit = input<Archivos_municipio | null>(null);

  // Outputs
  visibleChange = output<boolean>();
  save = output<FormData>();

  // Local signals
  archivoSeleccionado = signal<File | null>(null);
  isSaving = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);

  tiposArchivo = signal<string[]>(['Resultados', 'Informe', 'Reporte', 'Documento', 'Otro']);
  categorias = signal<string[]>(['Población', 'Económica', 'Social', 'Ambiental', 'Otro']);

  estatusOptions = signal<Array<{ label: string; value: 'A' | 'B' }>>([
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ]);

  municipiosOptions = computed<MunicipioOption[]>(() =>
    this.municipios().map((m) => ({ label: m.nombre, value: m.id_municipio }))
  );

  dialogTitle = computed(() => (this.isEditMode() ? 'Editar Archivo' : 'Nuevo Archivo Municipal'));

  // FormGroup with strict typing where possible
  archivoForm: FormGroup = this.fb.group({
    nombre_archivo: ['', [Validators.required, Validators.minLength(3)]],
    id_municipio: [null as number | null, [Validators.required]],
    tipo_archivo: ['', [Validators.required]],
    categoria_archivo: ['', [Validators.required]],
    subcategoria_archivo: [''],
    palabras_clave: [[], [Validators.maxLength(150)]],
    estatus_archivo: ['A', [Validators.required]],
    archivo: [null as File | null],
    fecha_archivo: [null as Date | null, Validators.required],
  });

  // track last loaded id to avoid overwriting user's edits
  private lastLoadedId: number | null = null;

  constructor() {
    // effect must live in constructor (signals pattern)
    effect(() => {
      const archivo = this.archivoToEdit();
      const editMode = this.isEditMode();
      const visible = this.visible();

      if (!visible) return;

      if (editMode && archivo && archivo.id_archivo !== this.lastLoadedId) {
        this.lastLoadedId = archivo.id_archivo;
        this.loadArchivoData(archivo);
      }

      if (!editMode) {
        // ensure we don't keep stale id when switching out of edit mode
        this.lastLoadedId = null;
      }
    });
  }

  // === Helpers ===
  isFieldInvalid(fieldName: string): boolean {
    const field = this.archivoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted()));
  }

  // PrimeNG FileUpload passes event.files: File[]
  onArchivoSelect(event: { files?: File[] } | unknown): void {
    if (!event || typeof event !== 'object') return;
    const maybe = event as { files?: File[] };
    const file = maybe.files && maybe.files[0] ? maybe.files[0] : null;
    if (file) {
      this.archivoSeleccionado.set(file);
      this.archivoForm.patchValue({ archivo: file });
      this.archivoForm.get('archivo')?.markAsTouched();

      // auto-fill name if empty
      if (!this.archivoForm.get('nombre_archivo')?.value) {
        const nombreSinExtension = file.name.split('.').slice(0, -1).join('.') || file.name;
        this.archivoForm.patchValue({ nombre_archivo: nombreSinExtension });
      }
    }
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.archivoForm.patchValue({ archivo: null });
    this.archivoForm.get('archivo')?.markAsTouched();

    if (this.fileUploader?.clear) {
      this.fileUploader.clear();
    }
  }

  handleSubmit(): void {
    // mark all controls
    Object.keys(this.archivoForm.controls).forEach((key) => {
      this.archivoForm.get(key)?.markAsTouched();
    });

    this.formSubmitted.set(true);

    // require file on create
    if (!this.isEditMode() && !this.archivoSeleccionado()) {
      this.archivoForm.get('archivo')?.setErrors({ required: true });
      return;
    }

    if (this.archivoForm.valid) {
      this.isSaving.set(true);
      const fd = this.buildFormData();
      this.save.emit(fd);
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
    this.archivoForm.reset({ estatus_archivo: 'A' });
    this.archivoSeleccionado.set(null);
    this.isSaving.set(false);
    this.formSubmitted.set(false);
    this.lastLoadedId = null;

    if (this.fileUploader && this.fileUploader.clear) {
      this.fileUploader.clear();
    }
  }

  loadArchivoData(archivo: Archivos_municipio): void {
    let fecha = null;

    if (archivo.fecha_archivo) {
      // 1. Convertimos a string por seguridad
      // 2. Quitamos la 'Z' para que el navegador NO haga conversión de zona horaria
      const fechaSinZ = archivo.fecha_archivo.toString().replace('Z', '');

      // 3. Creamos la fecha "limpia" (13:45 se queda como 13:45)
      fecha = new Date(fechaSinZ);
    }

    // Si parseSafeDate hace validaciones extra que necesitas,
    // podrías usar: this.parseSafeDate(fechaSinZ);
    // pero new Date(fechaSinZ) suele ser suficiente aquí.

    this.archivoForm.patchValue({
      nombre_archivo: archivo.nombre_archivo,
      id_municipio: archivo.id_municipio,
      tipo_archivo: archivo.tipo_archivo,
      categoria_archivo: archivo.categoria_archivo,
      subcategoria_archivo: archivo.subcategoria_archivo || '',
      palabras_clave:
        typeof archivo.palabras_clave === 'string'
          ? archivo.palabras_clave.split(',').map((p: string) => p.trim())
          : archivo.palabras_clave,
      estatus_archivo: archivo.estatus_archivo,
      fecha_archivo: fecha, // 👈 Asignamos la fecha corregida
      archivo: null,
    });
  }

  private parseSafeDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    // handle strings like '2025-12-05' or ISO '2025-12-05T00:00:00'
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private buildFormData(): FormData {
    const raw = this.archivoForm.getRawValue();
    const fd = new FormData();

    fd.append('nombre_archivo', raw.nombre_archivo || '');
    fd.append('id_municipio', String(raw.id_municipio ?? ''));
    fd.append('tipo_archivo', raw.tipo_archivo || '');
    fd.append('categoria_archivo', raw.categoria_archivo || '');
    fd.append('subcategoria_archivo', raw.subcategoria_archivo || '');

    // palabras_clave: keep as CSV string
    fd.append(
      'palabras_clave',
      Array.isArray(raw.palabras_clave) ? raw.palabras_clave.join(', ') : raw.palabras_clave || ''
    );

    fd.append('estatus_archivo', raw.estatus_archivo || 'A');

    if (raw.fecha_archivo) {
      const fechaLocal = this.datePipe.transform(raw.fecha_archivo, 'yyyy-MM-dd HH:mm:ss');

      console.log('raw.fecha_archivo', raw.fecha_archivo);
      console.log('Enviando fecha local:', fechaLocal); // Debería decir "2025-12-18 13:45:00"

      fd.append('fecha_archivo', fechaLocal || '');
    }

    /* if (raw.fecha_archivo instanceof Date && !isNaN(raw.fecha_archivo.getTime())) {
      // format as YYYY-MM-DD for backend that expects date only
      const y = raw.fecha_archivo.getFullYear();
      const m = String(raw.fecha_archivo.getMonth() + 1).padStart(2, '0');
      const d = String(raw.fecha_archivo.getDate()).padStart(2, '0');
      fd.append('fecha_archivo', `${y}-${m}-${d}`);
    } */

    const file = this.archivoSeleccionado();
    if (file) fd.append('archivo', file, file.name);

    return fd;
  }

  // Called by parent after successful save to reset UI
  public completeSave(): void {
    this.isSaving.set(false);
    this.resetForm();
    this.visibleChange.emit(false);
  }

  // Called by parent if save failed
  public cancelSave(): void {
    this.isSaving.set(false);
  }

  getSeverity(estatus: string): 'success' | 'secondary' {
    return estatus === 'A' ? 'success' : 'secondary';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
