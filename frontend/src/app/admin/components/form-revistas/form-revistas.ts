// nuevo/frontend/src/app/admin/components/form-revistas/form-revistas.ts
import { Component, signal, WritableSignal, input, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-form-revistas',
  imports: [
    DialogModule,
    TagModule,
    ButtonModule,
    AutoCompleteModule,
    ReactiveFormsModule,
    DatePickerModule,
  ],
  templateUrl: './form-revistas.html',
  styleUrl: './form-revistas.css',
})
export class FormRevistas {
  visible= input<boolean>(false);
  visibleChange = output<boolean>();

  editando = input<boolean>(false);
  revista = input<any>({});
  save = output<any>();

  revistaForm!: FormGroup;
  portadaPreview: string | null = null;
  archivoNombre?: string;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.revistaForm = this.fb.group({
      volumen: [this.revista().volumen || '', [Validators.required, Validators.min(1)]],
      numero_year: [this.revista().numero_year || '', [Validators.required, Validators.min(1)]],
      descripcion: [this.revista().descripcion || '', [Validators.required, Validators.maxLength(250)]],
      fecha: [this.revista().fecha || '', Validators.required],
      estatus: [this.revista().estatus || null, Validators.required],
      portadaFile: [null],
      archivoFile: [null],
    });
  }

  cerrarModal() {
    this.visible;
    this.visibleChange.emit(false);
  }

  onFileSelected(event: any, tipo: 'portada' | 'archivo') {
    const file = event.target.files[0];
    if (!file) return;

    if (tipo === 'portada') {
      this.revistaForm.patchValue({ portadaFile: file });
      const reader = new FileReader();
      reader.onload = () => (this.portadaPreview = reader.result as string);
      reader.readAsDataURL(file);
    }

    if (tipo === 'archivo') {
      this.revistaForm.patchValue({ archivoFile: file });
      this.archivoNombre = file.name;
    }
  }

  guardar() {
    if (this.revistaForm.invalid) {
      this.revistaForm.markAllAsTouched();
      this.cerrarModal();
      return;
    }

    const formData = new FormData();
    Object.entries(this.revistaForm.value).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
    
      if (value instanceof Blob) {
        // Archivos (portadaFile, archivoFile)
        formData.append(key, value);
      } else if (typeof value === 'object') {
        // Por si en el futuro tienes un objeto (e.g. dropdown con objeto)
        formData.append(key, JSON.stringify(value));
      } else {
        // Campos string, number, boolean
        formData.append(key, String(value));
      }
    });

    if (this.editando()) {
      formData.append('id_revista', this.revista().id_revista);
    }

    this.save.emit(formData);
    this.cerrarModal();
  }

  get f() {
    return this.revistaForm.controls;
  }

  estatuses = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];
  
  filterEstatus(event: any) {
    const query = event.query.toLowerCase();
    this.estatuses = [
      { label: 'Activo', value: 'A' },
      { label: 'Inactivo', value: 'B' },
    ].filter(e => e.label.toLowerCase().includes(query));
  }
}