// nuevo/frontend/src/app/public/components/form-testimonios/forms-testimonios.ts
import {
  Component,
  signal,
  inject,
  input,
  output,
  model,
  effect,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiMunicipio } from '../../../core/services/municipios';
import { ApiTestimonios } from '../../../core/services/testimonios';
import { environment } from '../../../../environments/environment';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../core/services/notificacion';

@Component({
  selector: 'app-form-testimonios',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './form-testimonios.html',
  styleUrl: './form-testimonios.css',
})
export class FormTestimonios {
  publicUrl = environment.publicUrl;

  private confirmationService = inject(ConfirmationService);
  private msg = inject(MessageService);
  private apiMunicipio = inject(ApiMunicipio);
  private apiTestimonios = inject(ApiTestimonios);
  private fb = inject(FormBuilder).nonNullable;
  private notifs = inject(NotificationService);

  // Inputs / Outputs
  visible = model.required<boolean>();
  isEditMode = input<boolean>(false);
  testimonioToEdit = input<any>(null);

  visibleChange = output<boolean>();

  // Estado
  formSubmitted = signal(false);
  isSaving = signal(false);

  municipios = signal<any[]>([]);
  imagenPreview = signal<string | null>(null);
  imagenFile = signal<File | null>(null);

  private lastLoadedId: number | null = null;

  // Formulario
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      id_municipio: ['', Validators.required],
      nombreM: ['', Validators.required],
      descripcion: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      estatus: ['B', Validators.required],
      imagenT: [''],
    });

    this.loadMunicipios();

    // Auto-carga si es edición
    effect(() => {
      const t = this.testimonioToEdit();
      if (this.visible() && this.isEditMode() && t && t.id_testimonio !== this.lastLoadedId) {
        this.lastLoadedId = t.id_testimonio;
        this.loadTestimonioData(t);
      } else if (!this.visible()) {
        this.lastLoadedId = null;
      }
    });
  }

  loadMunicipios(): void {
    this.apiMunicipio.getMessage().subscribe((resp: any) => {
      this.municipios.set(resp.data || []);
    });
  }

  seleccionarImagen(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.imagenFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.imagenPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.touched || this.formSubmitted()));
  }

  // Confirmación antes de enviar
  confirmarEnvio(): void {
    if (this.form.invalid) {
      this.formSubmitted.set(true);
      this.form.markAllAsTouched();
      this.mostrarAdvertencia('Datos inválidos');
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de enviar este testimonio? Una vez enviado, no podrá ser modificado. Será revisado por el equipo y, si es aprobado, se publicará.',
      header: 'Confirmación de Envío de Testimonio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, enviar',
      rejectLabel: 'No, cancelar',
      accept: () => this.handleSubmit()
    });
  }

  private handleSubmit(): void {
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => {
      fd.append(key, value as any);
    });

    if (this.imagenFile()) {
      fd.append('imagenT', this.imagenFile()!);
    }

    if (this.isEditMode() && this.testimonioToEdit()?.id_testimonio) {
      fd.append('id_testimonio', this.testimonioToEdit().id_testimonio);
    }

    this.isSaving.set(true);

    // 🔥 Llamar al servicio para crear el testimonio
    this.apiTestimonios.createTestimonio(fd).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del servidor:', resp);

        if (resp?.success) {
          this.mostrarExito('Testimonio registrado correctamente');

          // 🔔 Extraer ID de la respuesta
          let idTestimonio = null;
          
          if (resp?.data?.id_testimonios) {
            const idTest = resp.data.id_testimonios;
            
            // Si id_testimonios es un objeto, buscar el ID dentro
            if (typeof idTest === 'object' && idTest !== null) {
              idTestimonio = idTest.id || idTest.insertId || idTest.id_testimonios;
            } 
            // Si id_testimonios ya es el número
            else if (typeof idTest === 'number' || !isNaN(Number(idTest))) {
              idTestimonio = Number(idTest);
            }
          }
          
          // Fallback: buscar en otras ubicaciones
          if (!idTestimonio) {
            idTestimonio = resp?.data?.id || 
                        resp?.insertId || 
                        resp?.id;
          }

          // ⚠️ VALIDAR que sea un número
          if (typeof idTestimonio === 'number' || (typeof idTestimonio === 'string' && !isNaN(Number(idTestimonio)))) {
            const idNumerico = Number(idTestimonio);
            const nombre = this.form.value.nombreM;
            
            // Crear notificación con el ID numérico correcto
            this.notifs.agregar(
              `Nuevo testimonio registrado por ${nombre}`,
              {
                tipo: 'testimonio',
                idReferencia: idNumerico, // ✅ SOLO EL NÚMERO
                link: `/admin/testimonios`
              }
            );
            
            console.log('✅ Notificación creada con ID:', idNumerico);
          } else {
            console.error('❌ No se pudo extraer un ID válido de la respuesta:', resp);
          }

          this.resetForm();
          this.visibleChange.emit(false);
        } else {
          this.mostrarError(resp?.message || 'Error al registrar el testimonio');
        }

        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('❌ Error al enviar testimonio:', err);
        this.mostrarError('No se pudo registrar el testimonio');
        this.isSaving.set(false);
      }
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
    this.form.reset({ estatus: 'B' });
    this.imagenFile.set(null);
    this.imagenPreview.set(null);
    this.formSubmitted.set(false);
    this.isSaving.set(false);
  }

  loadTestimonioData(t: any): void {
    this.form.patchValue({
      id_municipio: t.id_municipio,
      nombreM: t.nombreM,
      descripcion: t.descripcion,
      correo: t.correo,
      telefono: t.telefono,
      estatus: t.estatus,
    });

    if (t.imagenT) {
      this.imagenPreview.set(this.publicUrl + 'testimonios/' + t.imagenT);
    }
  }

  private mostrarExito(detail: string): void {
    this.msg.add({ severity: 'success', summary: 'Éxito', detail });
  }

  private mostrarError(detail: string): void {
    this.msg.add({ severity: 'error', summary: 'Error', detail });
  }

  private mostrarAdvertencia(detail: string): void {
    this.msg.add({ severity: 'warn', summary: 'Advertencia', detail });
  }
}