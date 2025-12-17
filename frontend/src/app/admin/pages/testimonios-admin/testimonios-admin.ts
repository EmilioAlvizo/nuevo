// nuevo/frontend/src/app/admin/pages/testimonios-admin/testimonios-admin.ts
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  AfterViewInit,
  inject, 
  signal, 
  effect,
  ChangeDetectionStrategy 
} from '@angular/core';
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
import { HighlightService } from '../../../core/services/highlight';

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
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './testimonios-admin.html',
  styleUrl: './testimonios-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimoniosAdmin implements OnInit, OnDestroy, AfterViewInit {
  private apiTestimonios = inject(ApiTestimonios);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private apiMunicipio = inject(ApiMunicipio);
  private fb = inject(FormBuilder);
  highlight = inject(HighlightService);

  // ⭐ Usar signal en lugar de propiedades normales
  testimonios = signal<Testimonios[]>([]);
  municipios = signal<Municipio[]>([]);

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

    /**
     * 🔥 EFECTO CLAVE
     * Escucha el highlight y hace scroll al testimonio correcto
     */
    effect(() => {
      const highlightedId = this.highlight.highlightedId();
      const list = this.testimonios();

      if (!highlightedId || list.length === 0) return;

      // Llamar al método que hace scroll
      this.scrollToTestimonio(highlightedId);
    });
  }

  ngOnInit(): void {
    this.loading.set(true);

    // ⬇ Primera carga del servidor
    this.apiTestimonios
      .getTestimonios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Testimonios cargados inicialmente');
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar testimonios:', err);
          this.loading.set(false);
        },
      });

    // ⬇ Escucha *permanente* del BehaviorSubject
    this.apiTestimonios.testimonios$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lista) => {
        console.log('📊 Admin recibió actualización:', lista.length, 'testimonios');
        this.testimonios.set([...lista]);
      });

    this.cargarMunicipios();
  }

  ngAfterViewInit() {
    const idResaltado = this.highlight.highlightedId();
    if (idResaltado) {
      this.scrollToTestimonio(idResaltado);
    }
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
      estatus: ['A', Validators.required],
    });
  }

  cargarMunicipios(): void {
    this.apiMunicipio
      .getMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.municipios.set(res.data || []);
        },
        error: (error) => {
          console.error('Error al cargar municipios:', error);
          this.mostrarError('No se pudieron cargar los municipios');
        },
      });
  }

  // ===========================
  // 🎯 Scroll automático
  // ===========================
  private scrollToTestimonio(idTestimonio: number) {
    const intentarScroll = (intentos = 0) => {
      // Buscar la fila por el ID del testimonio
      let elemento = document.querySelector(`[data-testimonio-id="${idTestimonio}"]`);
      
      // Estrategia alternativa: buscar por clase highlight
      if (!elemento) {
        elemento = document.querySelector('.highlight-row');
      }
      
      if (elemento) {
        // Scroll suave
        elemento.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Agregar clase de animación
        elemento.classList.add('scroll-bounce');
        setTimeout(() => {
          elemento!.classList.remove('scroll-bounce');
        }, 600);
        
        return true;
      } else if (intentos < 8) {
        // Reintentar después de 250ms
        setTimeout(() => intentarScroll(intentos + 1), 250);
        return false;
      } else {
        console.warn('⚠️ No se pudo encontrar el testimonio con ID:', idTestimonio);
        return false;
      }
    };
    
    // Iniciar scroll después de un delay
    setTimeout(() => intentarScroll(), 500);
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
        estatus: testimonio.estatus,
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
    this.formTestimonio.reset({
      nombreM: '',
      id_municipio: null,
      correo: '',
      telefono: '',
      descripcion: '',
      estatus: 'A',
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

    this.submitting.set(true);
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

    if (this.editMode && this.selectedTestimonioId) {
      fd.append('id_testimonio', this.selectedTestimonioId.toString());
    }

    return fd;
  }

  // ===============================
  // CRUD
  // ===============================
  crearTestimonio(fd: FormData): void {
    this.apiTestimonios
      .createTestimonio(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Testimonio creado exitosamente');
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al crear testimonio');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al crear testimonio:', error);
          this.mostrarError('Error al crear el testimonio');
          this.submitting.set(false);
        },
      });
  }

  actualizarTestimonio(fd: FormData): void {
    this.apiTestimonios
      .updateTestimonio(this.selectedTestimonioId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Testimonio actualizado exitosamente');
            this.cerrarModal();
          } else {
            this.mostrarError(res.message || 'Error al actualizar testimonio');
          }
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar testimonio:', error);
          this.mostrarError('Error al actualizar el testimonio');
          this.submitting.set(false);
        },
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

  eliminarTestimonio(testimonio: Testimonios): void {
    this.confirm.confirm({
      message: '¿Estás seguro que deseas eliminar este testimonio?',
      accept: () => {
        this.apiTestimonios
          .deleteTestimonio(testimonio.id_testimonios)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.mostrarExito('Testimonio eliminado');
              }
            },
            error: (error) => {
              console.error('Error al eliminar testimonios:', error);
              this.mostrarError('Error al eliminar testimonio');
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