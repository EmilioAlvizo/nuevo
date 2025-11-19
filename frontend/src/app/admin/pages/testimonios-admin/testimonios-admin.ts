// nuevo/frontend/src/app/admin/pages/testimonios-admin/testimonios-admin.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { ApiTestimonios, Testimonios } from '../../../core/services/testimonios';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';

interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-testimonios-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ToolbarModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './testimonios-admin.html',
  styleUrl: './testimonios-admin.css',
})
export class TestimoniosAdmin implements OnInit, OnDestroy {

  // DATA
  testimonios: Testimonios[] = [];
  municipios: Municipio[] = [];

  // FORM
  formTestimonio!: FormGroup;

  // MODAL CONTROL
  modalVisible = false;
  editMode = false;
  selectedTestimonioId: number | null = null;

  // FILE
  selectedImage: File | null = null;
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  maxFileSize = 5242880; // 5MB

  // STATES
  loading = false;
  submitting = false;

  // ESTATUS
  estatusOptions: EstatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];

  // DESTROY
  private destroy$ = new Subject<void>();

  constructor(
    private apiTestimonios: ApiTestimonios,
    private apiMunicipio: ApiMunicipio,
    private fb: FormBuilder,
    private msg: MessageService,
    private confirm: ConfirmationService
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarTestimonios();
    this.cargarMunicipios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {
    this.formTestimonio = this.fb.group({
      nombreM: ['', Validators.required],
      id_municipio: [null, Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      estatus: ['A', Validators.required]
    });
  }

  // ===============================
  // CARGA DE DATOS
  // ===============================

  cargarTestimonios(): void {
    this.loading = true;
    this.apiTestimonios.getTestimonios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.testimonios = res.data || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar testimonios:', error);
          this.mostrarError('Error al cargar testimonios');
          this.loading = false;
        }
      });
  }

  cargarMunicipios(): void {
    this.apiMunicipio.getMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.municipios = res.data || [];
        },
        error: (error) => {
          console.error('Error al cargar municipios:', error);
          this.mostrarError('No se pudieron cargar los municipios');
        }
      });
  }

  // ===============================
  // MODAL
  // ===============================

  abrirModal(testimonio?: Testimonios): void {
    if (testimonio) {
      this.editMode = true;
      this.selectedTestimonioId = testimonio.id_testimonios;

      this.formTestimonio.patchValue({
        nombreM: testimonio.nombreM,
        id_municipio: testimonio.id_municipio,
        correo: testimonio.correo,
        telefono: testimonio.telefono,
        descripcion: testimonio.descripcion,
        estatus: testimonio.estatus
      });
    } else {
      this.editMode = false;
      this.selectedTestimonioId = null;
      this.formTestimonio.reset({
        nombreM: '',
        id_municipio: null,
        correo: '',
        telefono: '',
        descripcion: '',
        estatus: 'A'
      });
    }

    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formTestimonio.reset({
      nombreM: '',
      id_municipio: null,
      correo: '',
      telefono: '',
      descripcion: '',
      estatus: 'A'
    });
    this.selectedImage = null;
    this.editMode = false;
    this.selectedTestimonioId = null;
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
    if (this.formTestimonio.invalid) {
      this.formTestimonio.markAllAsTouched();
      this.mostrarAdvertencia('Complete todos los campos requeridos correctamente.');
      return;
    }

    if (!this.editMode && !this.selectedImage) {
      this.mostrarAdvertencia('Debe seleccionar una imagen para el nuevo testimonio.');
      return;
    }

    this.submitting = true;
    const formData = this.prepararFormData();

    if (this.editMode && this.selectedTestimonioId) {
      this.actualizarTestimonio(formData);
    } else {
      this.crearTestimonio(formData);
    }
  }

  prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formTestimonio.value;

    fd.append('nombreM', v.nombreM);
    fd.append('id_municipio', v.id_municipio?.toString() || '');
    fd.append('correo', v.correo);
    fd.append('telefono', v.telefono);
    fd.append('descripcion', v.descripcion);
    fd.append('estatus', v.estatus);

    if (this.selectedImage) {
      fd.append('imagenT', this.selectedImage);
    }

    return fd;
  }

  // ===============================
  // CRUD LOCAL
  // ===============================

  crearTestimonio(fd: FormData): void {
    this.apiTestimonios.createTestimonio(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Testimonio creado exitosamente');

            // Insertar en la lista local
            if (res.data) {
              this.testimonios = [res.data, ...this.testimonios];
            }

            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear testimonio');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear testimonio:', error);
          this.mostrarError('Error al crear el testimonio');
          this.submitting = false;
        }
      });
  }

  actualizarTestimonio(fd: FormData): void {
    this.apiTestimonios.updateTestimonio(this.selectedTestimonioId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Testimonio actualizado exitosamente');

            // Actualizar en la lista local
            const index = this.testimonios.findIndex(t => t.id_testimonios === this.selectedTestimonioId);
            if (index !== -1) {
              this.testimonios[index] = { ...this.testimonios[index], ...this.formTestimonio.value, ...(res.data || {}) };
              this.testimonios = [...this.testimonios]; // Forzar refresh
            }

            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar testimonio');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar testimonio:', error);
          this.mostrarError('Error al actualizar el testimonio');
          this.submitting = false;
        }
      });
  }

  getImageUrl(testimonio: Testimonios): string {
    return `http://localhost:3000/public/testimonios/${testimonio.id_testimonios}/${testimonio.imagenT}`;
  }

  // ===============================
  // HELPERS
  // ===============================

  hasError(field: string): boolean {
    const control = this.formTestimonio.get(field);
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
