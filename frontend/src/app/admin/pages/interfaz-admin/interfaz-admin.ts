// nuevo/frontend/src/app/admin/pages/interfaz-admin/interfaz-admin.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';

import { InterfazService, InterfazConfig } from '../../../core/services/interfaz';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-interfaz-admin',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './interfaz-admin.html',
  styleUrl: './interfaz-admin.css',
})
export class InterfazAdmin implements OnInit, OnDestroy {
  publicUrl = environment.publicUrl;
  private interfazService = inject(InterfazService);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  // Signals
  configuraciones = signal<InterfazConfig[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // FORM
  formInterfaz!: FormGroup;

  // MODAL CONTROL
  modalVisible = false;
  selectedConfigId: number | null = null;

  // FILE
  selectedImage: File | null = null;
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  maxFileSize = 5242880; // 5MB

  // ESTATUS
  estatusOptions: EstatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];

  // DESTROY
  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarConfiguraciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {
    this.formInterfaz = this.fb.group({
      nombre: [{ value: '', disabled: true }], // Solo lectura
      auxiliar: [''],
      estatus: ['A', Validators.required],
    });
  }

  cargarConfiguraciones(): void {
    this.loading.set(true);
    this.interfazService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.configuraciones.set(configs);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar configuraciones:', error);
          this.mostrarError('No se pudieron cargar las configuraciones');
          this.loading.set(false);
        },
      });
  }

  // ===============================
  // MODAL
  // ===============================

  abrirModal(config: InterfazConfig): void {
    this.selectedConfigId = config.id_config;

    this.formInterfaz.patchValue({
      nombre: config.nombre,
      auxiliar: config.auxiliar,
      estatus: config.estatus,
    });

    this.selectedImage = null;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formInterfaz.reset({
      nombre: '',
      auxiliar: '',
      estatus: 'A',
    });
    this.selectedImage = null;
    this.selectedConfigId = null;
  }

  // ===============================
  // ARCHIVO
  // ===============================

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];

    if (!file) {
      this.selectedImage = null;
      return;
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      this.mostrarAdvertencia('Formato no permitido. Use JPG, PNG, GIF o WEBP.');
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia('La imagen supera los 5MB.');
      this.selectedImage = null;
      event.target.value = '';
      return;
    }

    this.selectedImage = file;
    this.mostrarExito('Imagen seleccionada correctamente.');
  }

  // ===============================
  // SUBMIT
  // ===============================

  submitForm(): void {
    if (this.formInterfaz.invalid) {
      this.formInterfaz.markAllAsTouched();
      this.mostrarAdvertencia('Complete todos los campos requeridos correctamente.');
      return;
    }

    this.submitting.set(true);
    const formData = this.prepararFormData();
    this.actualizarConfig(formData);
  }

  prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formInterfaz.value;

    fd.append('nombre', this.formInterfaz.get('nombre')?.value || ''); // Obtener valor disabled
    fd.append('auxiliar', v.auxiliar || '');
    fd.append('estatus', v.estatus);

    if (this.selectedImage) {
      fd.append('archivo', this.selectedImage);
    }

    return fd;
  }

  // ===============================
  // ACTUALIZAR
  // ===============================

  actualizarConfig(fd: FormData): void {
    this.interfazService
      .update(this.selectedConfigId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Configuración actualizada exitosamente');
            this.cargarConfiguraciones();
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar configuración');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar configuración:', error);
          this.mostrarError('Error al actualizar la configuración');
          this.submitting.set(false);
        },
      });
  }

  getImageUrl(config: InterfazConfig): string {
    if (!config.archivo) return '';
    return `${this.publicUrl}/interfaz/${config.id_config}/${config.archivo}`;
  }

  // ===============================
  // DESCARGAR ARCHIVO
  // ===============================

  descargarArchivo(config: InterfazConfig): void {
  if (!config.archivo) {
    this.mostrarAdvertencia('No hay archivo para descargar');
    return;
  }

  const url = this.getImageUrl(config);

  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = config.archivo;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);

      this.mostrarExito('Descarga iniciada');
    })
    .catch(() => {
      this.mostrarAdvertencia('No se pudo descargar el archivo');
    });
}


  // ===============================
  // HELPERS
  // ===============================

  hasError(field: string): boolean {
    const control = this.formInterfaz.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getEstatusLabel(estatus: string): string {
    return estatus === 'A' ? 'Activo' : 'Inactivo';
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