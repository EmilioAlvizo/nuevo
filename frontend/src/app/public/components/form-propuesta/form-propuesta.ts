// frontend/src/app/public/components/form-propuesta/form-propuesta.ts
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
import { ApiPropuesta, Propuesta } from '../../../core/services/propuestas_accion';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { NotificationService } from '../../../core/services/notificacion';

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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-form-propuesta',
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
    ConfirmDialogModule,
  ],
  templateUrl: './form-propuesta.html',
  styleUrl: './form-propuesta.css',
  providers: [MessageService, ConfirmationService]
})
export class FormPropuesta {
  publicUrl = environment.publicUrl;
  apiPropuesta = inject(ApiPropuesta);
  apiMunicipio = inject(ApiMunicipio);
  private msg = inject(MessageService);
  private fb = new FormBuilder().nonNullable;
  private notifs = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  // Inputs/Outputs
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

  //municipiosOptions: any[] = [];
  municipiosOptions = signal<any[]>([]);

  showEspecifica = false;

  ngOnInit(): void {
    this.loadMunicipios();
  }

  // Formulario
  propuestaForm: FormGroup;
  private lastLoadedId: number | null = null;

  constructor() {
    this.propuestaForm = this.fb.group({
      nombre: ['', Validators.required],
      sexo: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(99)]],
      actividad: ['', Validators.required],
      especifica: [''],
      correo: ['', [Validators.required, Validators.email]],
      municipio: ['', Validators.required],
      zona: ['', Validators.required],
      detalle: ['', Validators.required],
      justificacion: ['', Validators.required],
      necesidades: ['', Validators.required],
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


  sexoOptions = [
    { label: 'Mujer', value: 'Mujer' },
    { label: 'Hombre', value: 'Hombre' },
  ];

  actividadOptions = [
    { label: 'Investigador', value: 'Investigador' },
    { label: 'Ama de casa', value: 'Ama de casa' },
    { label: 'Estudiante', value: 'Estudiante' },
    { label: 'Empleado', value: 'Empleado' },
    { label: 'Servidor público', value: 'Servidor público' },
    { label: 'Docente', value: 'Docente' },
    { label: 'Ciudadano', value: 'Ciudadano' },
    { label: 'Otro', value: 'Otro' },
  ];

  zonaOptions = [
    { label: 'Urbana', value: 'Urbana' },
    { label: 'Rural', value: 'Rural' },
    { label: 'Semiurbana', value: 'Semiurbana' },
  ];

  isFieldInvalid(field: string): boolean {
    const control = this.propuestaForm.get(field);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  onArchivoSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.archivoNombre.set(file.name);
      this.propuestaForm.patchValue({ archivoFile: file });
    }
  }

  onArchivoRemove(): void {
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.propuestaForm.patchValue({ archivoFile: null });
  }

  confirmarEnvio() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de enviar la propuesta? Una vez enviada, esta será revisada por el equipo correspondiente y no podrá ser modificada. ¿Deseas continuar con el envío?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, enviar',
      rejectLabel: 'No, cancelar',
      accept: () => this.handleSubmit(),
    });
  }

  handleSubmit(): void {
    if (this.propuestaForm.invalid) {
      this.propuestaForm.markAllAsTouched();
      return;
    }

    const form = this.propuestaForm.value;

    const data = {
      nombreC: form.nombre,
      sexo: form.sexo,
      edad: form.edad,
      actividad: form.actividad === 'Otro' ? form.especifica : form.actividad,
      correo: form.correo,
      id_municipio: form.municipio,
      zona: form.zona,
      detalle: form.detalle,
      justificacion: form.justificacion,
      necesidades: form.necesidades,
    };

    this.apiPropuesta.crearPropuestaPublico(data).subscribe({
      next: (resp) => {
        this.msg.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Propuesta registrada correctamente',
        });

        // 🔔 Extraer ID de la respuesta
        let idPropuesta = null;
        
        if (resp?.data?.id_propuesta) {
          const idProp = resp.data.id_propuesta;
          
          // Si id_propuesta es un objeto, buscar el ID dentro
          if (typeof idProp === 'object' && idProp !== null) {
            idPropuesta = idProp.id || idProp.insertId || idProp.id_propuesta;
          } 
          // Si id_propuesta ya es el número
          else if (typeof idProp === 'number' || !isNaN(Number(idProp))) {
            idPropuesta = Number(idProp);
          }
        }
        
        // Fallback: buscar en otras ubicaciones
        if (!idPropuesta) {
          idPropuesta = resp?.data?.id || 
                      resp?.insertId || 
                      resp?.id;
        }

        // ⚠️ VALIDAR que sea un número
        if (typeof idPropuesta === 'number' || (typeof idPropuesta === 'string' && !isNaN(Number(idPropuesta)))) {
          const idNumerico = Number(idPropuesta);
          
          // Crear notificación con el ID numérico correcto
          this.notifs.agregar(
            `Nueva propuesta de acción registrada por ${form.nombre}`,
            {
              tipo: 'propuesta',
              idReferencia: idNumerico, // ✅ SOLO EL NÚMERO
              link: `/admin/propuestas-accion`
            }
          );
          
          console.log('✅ Notificación creada con ID:', idNumerico);
        } else {
          console.error('❌ No se pudo extraer un ID válido de la respuesta:', resp);
        }

        this.visibleChange.emit(false);
      },
      error: (err) => {
        console.error('❌ Error al enviar propuesta:', err);

        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo registrar la propuesta',
        });
      },
    });
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
    this.propuestaForm.reset({ estatus_documento: 'A' });
    this.archivoSeleccionado.set(null);
    this.archivoNombre.set(null);
    this.formSubmitted.set(false);
    this.isSaving.set(false);
    this.lastLoadedId = null;
  }

  loadDocData(doc: any): void {
    this.propuestaForm.patchValue({
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

  loadMunicipios() {
    this.apiMunicipio.getMessage().subscribe({
      next: (resp) => {
        if (resp?.data) {
          this.municipiosOptions.set(resp.data.map((m) => ({
            label: m.nombre,
            value: m.id_municipio,
          })));
        }
      },
      error: (err) => {
        console.error('Error cargando municipios', err);
      },
    });
  }

  onActividadChange(value: string) {
    this.showEspecifica = value === 'Otro';

    if (this.showEspecifica) {
      this.propuestaForm.get('especifica')?.setValidators([Validators.required]);
    } else {
      this.propuestaForm.get('especifica')?.clearValidators();
      this.propuestaForm.get('especifica')?.setValue('');
    }

    this.propuestaForm.get('especifica')?.updateValueAndValidity();
  }

}
