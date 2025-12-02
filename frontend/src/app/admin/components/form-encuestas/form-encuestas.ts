// nuevo/frontend/src/app/admin/components/form-encuesta/form-encuesta.ts
import { Component, signal, input, output, inject, model, effect, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl  } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-form-encuestas',
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    ReactiveFormsModule,
    TagModule,
    AutoCompleteModule,
    SelectModule,
  ],
  templateUrl: './form-encuestas.html',
  styleUrl: './form-encuestas.css',
})
export class FormEncuestas {
  private fb = new FormBuilder().nonNullable;

  // Inputs / Outputs
  visible = model.required<boolean>();
  isEditMode = input<boolean>(false);
  encuestaToEdit = input<any>(null);

  visibleChange = output<boolean>();
  save = output<FormData>();

  formSubmitted = signal(false);
  isSaving = signal(false);

  estatusOptions = [
    { label: 'Activa', value: true },
    { label: 'Inactiva', value: false },
  ];

  encuestaForm: FormGroup;
  private lastLoadedId: number | null = null;

  constructor() {
    this.encuestaForm = this.fb.group({
      pregunta: ['', [Validators.required, Validators.maxLength(500)]],
      fechaInicio: [null, Validators.required],
      fechaFin: [null, Validators.required],
      activa: [false, Validators.required],
      opciones: this.fb.array<FormControl<string>>([], { validators: Validators.required }),
    });

    effect(() => {
      const enc = this.encuestaToEdit();
      console.log("encuestaToEdit recibida >>>", enc);   // 👈 AGREGA ESTO
      const isVisible = this.visible();
      const isEdit = this.isEditMode();

      if (isVisible && isEdit && enc && enc.idEncuesta !== this.lastLoadedId) {
        this.lastLoadedId = enc.idEncuesta;
        this.loadEncuestaData(enc);
      } /* else if (!isVisible) {
        this.lastLoadedId = null;
      } */
    });
  }

  get opcionesArray(): FormArray<FormControl<string>> {
    return this.encuestaForm.get('opciones') as FormArray<FormControl<string>>;
  }

  addOpcion(value: string = '') {
    this.opcionesArray.push(
      this.fb.control<string>(value, {
        validators: [Validators.required, Validators.maxLength(300)],
      })
    );
  }

  removeOpcion(i: number) {
    this.opcionesArray.removeAt(i);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.encuestaForm.get(field);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  handleSubmit() {
    this.formSubmitted.set(true);
    Object.values(this.encuestaForm.controls).forEach((c) => c.markAsTouched());

    if (this.encuestaForm.valid) {
      const fd = this.buildFormData();
      this.isSaving.set(true);
      this.save.emit(fd);
    }
  }

  private buildFormData(): FormData {
    const v = this.encuestaForm.getRawValue();
    const fd = new FormData();

    fd.append('pregunta', v.pregunta);
    fd.append('fechaInicio', new Date(v.fechaInicio).toISOString());
    fd.append('fechaFin', new Date(v.fechaFin).toISOString());
    fd.append('activa', v.activa ? '1' : '0');

    v.opciones.forEach((opc: string) => fd.append('opciones[]', opc));

    if (this.isEditMode() && this.encuestaToEdit()?.idEncuesta) {
      fd.append('idEncuesta', this.encuestaToEdit().idEncuesta);
    }

    return fd;
  }

  handleCancel() {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  handleDialogHide() {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  resetForm() {
    this.encuestaForm.reset({ activa: false });
    this.opcionesArray.clear();
    this.formSubmitted.set(false);
    this.isSaving.set(false);
    this.lastLoadedId = null;
  }

  loadEncuestaData(enc: any) {
    this.encuestaForm.patchValue({
      pregunta: enc.pregunta,
      fechaInicio: new Date(enc.fechaInicio),
      fechaFin: new Date(enc.fechaFin),
      activa: enc.activa,
    });

    this.opcionesArray.clear();

    console.log("cargando opciones ", enc.opciones)

    if (enc.opciones) {
      enc.opciones.forEach((o: any) => this.addOpcion(o.textoOpcion));
    }
  }
}
