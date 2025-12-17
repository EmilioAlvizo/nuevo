import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

//PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectItem, SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';



import { ApiIntegrantesConsejo, IntegrantesConsejo } from '../../../core/services/consejo';


interface EstatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-consejo-admin',
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
    TooltipModule,
    SelectItem
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './consejo-admin.html',
  styleUrl: './consejo-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsejoAdmin {
  private apiIntegrantesConsejo = inject(ApiIntegrantesConsejo);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  publicUrl = environment.publicUrl;

  // ⭐ Usar signal en lugar de propiedades normales
  integrantesConsejo = signal<IntegrantesConsejo[]>([]);

  // FORM
  formConsejo!: FormGroup;

  // MODAL CONTROL
  modalVisible = false;
  editMode = false;
  selectedIntegranteId: number | null = null;

  // FILE
  selectedImage: File | null = null;
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  maxFileSize = 5242880; // 5MB

  // STATES
  loading = signal(false);
  submitting = signal(false);

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
  this.loading.set(true);

  this.apiIntegrantesConsejo
    .getIntegrantes()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (resp) => {
        if (resp.success) {
          // actualiza la señal
          this.integrantesConsejo.set(resp.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar integrantes:', err);
        this.mostrarError('Error al cargar los integrantes');
        this.loading.set(false);
      },
    });
}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {
    this.formConsejo = this.fb.group({
      nombre: ['', Validators.required],
      cargo: ['', [Validators.required]],
      cargo_consejo: ['', [Validators.required]],
      importancia: ['', [Validators.required]],
      estatus: ['A', Validators.required],
    });
  }

  // ===============================
  // MODAL
  // ===============================

  abrirModal(integrante?: IntegrantesConsejo): void {
    if (integrante) {
      this.editMode = true;
      this.selectedIntegranteId = integrante.id_integrante;

      this.formConsejo.patchValue({
        nombre: integrante.nombre,
        cargo: integrante.cargo,
        cargo_consejo: integrante.cargo_consejo,
        importancia: integrante.importancia,
        estatus: integrante.estatus,
      });
    } else {
      this.editMode = false;
      this.selectedIntegranteId = null;
      this.formConsejo.reset({
        nombre: '',
        cargo: '',
        cargo_consejo: '',
        importancia: '',
        estatus: 'A',
      });
    }

    this.selectedImage = null;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formConsejo.reset({
      nombre: '',
      cargo: '',
      cargo_consejo: '',
      importancia: '',
      estatus: 'A',
    });
    this.selectedImage = null;
    this.editMode = false;
    this.selectedIntegranteId = null;
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
    if (this.formConsejo.invalid) {
      this.formConsejo.markAllAsTouched();
      this.mostrarAdvertencia('Complete todos los campos requeridos correctamente.');
      return;
    }

    if (!this.editMode && !this.selectedImage) {
      this.mostrarAdvertencia('Debe seleccionar una imagen para el nuevo integrante del consejo.');
      return;
    }

    this.submitting.set(true);
    const formData = this.prepararFormData();

    if (this.editMode && this.selectedIntegranteId) {
      this.actualizarIntegrante(formData);
    } else {
      this.crearIntegrante(formData);
    }
  }

  prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formConsejo.value;

    fd.append('nombre', v.nombre);
    fd.append('cargo', v.cargo);
    fd.append('cargo_consejo', v.cargo_consejo);
    fd.append('importancia', v.importancia);
    fd.append('estatus', v.estatus);

    if (this.selectedImage) {
      fd.append('imagen', this.selectedImage);
    }

    if (this.editMode && this.selectedIntegranteId) {
      fd.append('id_integrante', this.selectedIntegranteId.toString());
    }

    return fd;
  }

  // ===============================
  // CRUD
  // ===============================

  crearIntegrante(fd: FormData): void {
    this.apiIntegrantesConsejo
      .createIntegrante(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Integrante creado exitosamente');
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear integrante');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al crear integrante:', error);
          this.mostrarError('Error al crear el integrante');
          this.submitting.set(false);
        },
      });
  }

  actualizarIntegrante(fd: FormData): void {
    this.apiIntegrantesConsejo
      .updateIntegrante(this.selectedIntegranteId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Integrante actualizado exitosamente');
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar integrante');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar integrante:', error);
          this.mostrarError('Error al actualizar el integrante');
          this.submitting.set(false);
        },
      });
  }

  getImageUrl(integrante: IntegrantesConsejo): string {
    return `${this.publicUrl}/integrantes_consejo/${integrante.id_integrante}/${integrante.imagen}`;
  }

  // ===============================
  // HELPERS
  // ===============================

  hasError(field: string): boolean {
    const control = this.formConsejo.get(field);
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

  eliminarIntegrante(integrante: IntegrantesConsejo): void {
    this.confirm.confirm({
      message: '¿Estás seguro que deseas eliminar este integrante?',
      accept: () => {
        this.apiIntegrantesConsejo
          .deleteIntegrante(integrante.id_integrante)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.mostrarExito('Integrante eliminado');
              }
            },
            error: (error) => {
              console.error('Error al eliminar integrante:', error);
              this.mostrarError('Error al eliminar integrante');
            },
          });
      },
    });
  }

  // Personalización con Design Tokens de PrimeNG
  tablaDesignTokens = {
    tableContainer: {
      borderRadius: '10rem',
    }
  };
}