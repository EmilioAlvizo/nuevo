// nuevo/frontend/src/app/admin/components/form-doc-cendoc/form-doc-cendoc.ts
import {
  Component,
  signal,
  input,
  output,
  inject,
  ViewChild,
  computed,
  effect,
  model,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ApiCategoriaCendoc, Categoria_cendoc } from '../../../core/services/categorias_cendoc';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';

interface Option {
  label: string;
  value: number;
}

interface Estatus {
  label: string;
  value: string;
}

@Component({
  selector: 'app-form-doc-cendoc',
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    FileUploadModule,
    SelectModule,
    ReactiveFormsModule,
    DatePickerModule,
    TagModule,
    AutoCompleteModule,
  ],
  templateUrl: './form-doc-cendoc.html',
  styleUrl: './form-doc-cendoc.css',
})
export class FormDocCendoc {
  publicUrl = environment.publicUrl;
  apiCategoriaCendoc = inject(ApiCategoriaCendoc);
  private fb = new FormBuilder().nonNullable;

  // Inputs/Outputs
  categorias = input.required<Categoria_cendoc[]>();
  visible = model.required<boolean>();
  isEditMode = input<boolean>(false);
  docToEdit = input<any>(null);

  visibleChange = output<boolean>();
  save = output<FormData>();

  // Estado y archivos
  archivoSeleccionado = signal<File | null>(null);
  archivoNombre = signal<string | null>(null);
  isSaving = signal(false);
  formSubmitted = signal(false);

  estatusOptions = signal<Estatus[]>([
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'I' },
  ]);

  categoriasOptions = computed(() =>
    this.categorias().map((m) => ({
      label: m.nombre_categoria_cendoc,
      value: m.id_categoria_cendoc,
    }))
  );

  // Formulario
  docForm: FormGroup;
  private lastLoadedId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.docForm = this.fb.group({
      nombre_documento: ['', [Validators.required, Validators.maxLength(150)]],
      autor_documento: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion_documento: ['', [Validators.required, Validators.maxLength(500)]],
      id_categoria_cendoc: [null as string | null, Validators.required],
      palabras_clave: [[], [Validators.maxLength(150)]],
      fecha_documento: [null as Date | null, Validators.required],
      estatus_documento: ['A', Validators.required],
      archivoFile: [null as File | null],
    });

    effect(() => {
      const doc = this.docToEdit();
      const isVisible = this.visible();
      const isEdit = this.isEditMode();

      if (isVisible && isEdit && doc && doc.id_documento !== this.lastLoadedId) {
        this.lastLoadedId = doc.id_documento;
        this.loadDocData(doc);
      } else if (!isVisible) {
        this.lastLoadedId = null;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.docForm.get(field);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  onArchivoSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.archivoNombre.set(file.name);
      this.docForm.patchValue({ archivoFile: file });
    }
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.docForm.patchValue({ archivoFile: null });
  }

  handleSubmit(): void {
    this.formSubmitted.set(true);
    Object.values(this.docForm.controls).forEach((c) => c.markAsTouched());

    if (!this.isEditMode() && !this.archivoSeleccionado()) {
      this.docForm.get('archivoFile')?.setErrors({ required: true });
    }

    if (this.docForm.valid) {
      const formData = this.buildFormData();
      this.isSaving.set(true);
      this.save.emit(formData);
    }
  }

  private buildFormData(): FormData {
    const formValue = this.docForm.getRawValue();
    const fd = new FormData();

    fd.append('nombre_documento', formValue.nombre_documento);
    fd.append('autor_documento', formValue.autor_documento);
    fd.append('descripcion_documento', formValue.descripcion_documento);
    fd.append('id_categoria_cendoc', formValue.id_categoria_cendoc);
    fd.append(
      'palabras_clave',
      Array.isArray(formValue.palabras_clave)
        ? formValue.palabras_clave.join(', ')
        : formValue.palabras_clave || ''
    );
    fd.append('estatus_documento', formValue.estatus_documento);

    if (formValue.fecha_documento) {
      const fecha =
        formValue.fecha_documento instanceof Date
          ? formValue.fecha_documento
          : new Date(formValue.fecha_documento);
      fd.append('fecha_documento', fecha.toISOString().slice(0, 19).replace('T', ' '));
    }

    if (this.archivoSeleccionado()) {
      fd.append('archivo', this.archivoSeleccionado()!);
    }

    if (this.isEditMode() && this.docToEdit()?.id_documento) {
      fd.append('id_documento', this.docToEdit().id_documento);
    }

    return fd;
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
    this.docForm.reset({ estatus_documento: 'A' });
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.formSubmitted.set(false);
    this.isSaving.set(false);
    this.lastLoadedId = null;
  }

  loadDocData(doc: any): void {
    this.docForm.patchValue({
      nombre_documento: doc.nombre_documento,
      autor_documento: doc.autor_documento,
      descripcion_documento: doc.descripcion_documento,
      id_categoria_cendoc: doc.id_categoria_cendoc,
      palabras_clave:
        typeof doc.palabras_clave === 'string'
          ? doc.palabras_clave.split(',').map((p: string) => p.trim())
          : doc.palabras_clave,
      fecha_documento: doc.fecha_documento ? new Date(doc.fecha_documento) : null,
      estatus_documento: doc.estatus_documento,
    });
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
