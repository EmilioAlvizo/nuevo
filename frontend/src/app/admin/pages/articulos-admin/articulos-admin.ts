import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Imports
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
import { AccordionModule } from 'primeng/accordion';

import { ApiArticulos, Articulos } from '../../../core/services/articulos';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';

interface StatusOption {
  label: string;
  value: string;
}

// Interfaz para el agrupamiento
interface GroupedArticulo {
  revista: Revistas | null;
  articulos: Articulos[];
}

@Component({
  selector: 'app-articulos-admin',
  standalone: true,
  templateUrl: './articulos-admin.html',
  styleUrls: ['./articulos-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // MEJORA: Rendimiento y control de estado
  providers: [MessageService, ConfirmationService, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    CardModule,
    ToolbarModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    AccordionModule,
  ],
})
export class ArticulosAdmin implements OnInit, OnDestroy {
  // ======================================================
  // INYECCIÓN
  // ======================================================
  private api = inject(ApiArticulos);
  private apiRevistas = inject(ApiRevistas);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private datePipe = inject(DatePipe);

  // ===========================
  // Estado (Signals)
  // ===========================
  articulos = signal<Articulos[]>([]);
  revistas = signal<Revistas[]>([]);

  // Estado de UI
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  modalContenidoVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // Variables simples (no afectan reactividad crítica o se manejan localmente)
  selectedArticuloId: number | null = null;
  selectedImage: File | null = null;
  contenidoVista: string | null = null;

  // ===========================
  // Estado Derivado (Computed) - SOLUCIÓN AL PROBLEMA DE RENDERIZADO
  // ===========================

  // 1. Opciones para el Select (se recalcula auto cuando 'revistas' cambia)
  revistasOptions = computed(() => {
    return this.revistas().map((r) => ({
      label: `Vol. ${r.volumen} - Núm. ${r.numero_year} (${this.datePipe.transform(
        r.fecha,
        'dd/MM/yyyy',
        'UTC'
      )})`,
      value: r.id_revista,
    }));
  });

  // 2. Opciones con Nulo
  revistasOptionsConNulo = computed(() => {
    return [{ label: 'Sin revista', value: null }, ...this.revistasOptions()];
  });

  // 3. Agrupación de Artículos (Lógica movida aquí)
  groupedArticulos = computed<GroupedArticulo[]>(() => {
    const currentRevistas = this.revistas();
    const currentArticulos = this.articulos();

    // Si no hay datos, retornar vacío
    if (currentArticulos.length === 0) return [];

    const articulosSinRevista = currentArticulos.filter((a) => !a.id_revista);

    const agrupados = currentRevistas.map((rev) => ({
      revista: rev,
      articulos: currentArticulos.filter((a) => a.id_revista === rev.id_revista),
    }));

    // Agregar los sin revista al final
    return [
      ...agrupados,
      {
        revista: null,
        articulos: articulosSinRevista,
      },
    ];
  });

  // ===========================
  // Configuración
  // ===========================
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  maxFileSize = 5 * 1024 * 1024; // 5MB

  estatusOptions: StatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' },
  ];

  formArticulo!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor() {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // CARGA DE DATOS
  // ===========================
  cargarDatosIniciales(): void {
    this.loading.set(true);

    // Cargar Revistas
    this.apiRevistas
      .getRevistas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.revistas.set(res.data);
          // Ya no necesitamos calcular options ni groups manualmente aquí
          // computed() lo hace por nosotros.
          this.cargarArticulos();
        },
        error: () => {
          this.mostrarError('Error al cargar revistas');
          this.cargarArticulos(); // Intentar cargar artículos de todos modos
        },
      });
  }

  cargarArticulos(): void {
    // Nota: loading ya es true desde cargarDatosIniciales o se puede setear aquí
    this.api
      .getArticulos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.articulos.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.mostrarError('Error al cargar artículos');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // FORMULARIO
  // ===========================
  private inicializarFormulario(): void {
    this.formArticulo = this.fb.group({
      id_revista: [null],
      titulo: ['', Validators.required],
      autor: ['', Validators.required],
      contenido: ['', Validators.required],
      estatus: ['A', Validators.required],
      pagina: [{ value: null, disabled: true }],
    });
  }

  private setupFormListeners(): void {
    this.formArticulo
      .get('id_revista')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((idRevista) => {
        const paginaControl = this.formArticulo.get('pagina');
        if (idRevista) {
          paginaControl?.enable();
          paginaControl?.setValidators([Validators.required, Validators.min(1)]);
        } else {
          paginaControl?.disable();
          paginaControl?.clearValidators();
          paginaControl?.setValue(null);
        }
        paginaControl?.updateValueAndValidity();
      });
  }

  // ===========================
  // MODAL
  // ===========================
  abrirModal(art?: Articulos): void {
    this.modalVisible.set(true);

    if (art) {
      this.editMode.set(true);
      this.selectedArticuloId = art.id_articulo;
      this.formArticulo.patchValue({
        id_revista: art.id_revista,
        titulo: art.titulo,
        autor: art.autor,
        pagina: art.pagina,
        contenido: art.contenido,
        estatus: art.estatus,
      });
    } else {
      this.editMode.set(false);
      this.selectedArticuloId = null;
      this.formArticulo.reset({ estatus: 'A' });
      this.selectedImage = null;
    }
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    // Pequeño delay para limpiar formulario después de la animación
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formArticulo.reset({ estatus: 'A' });
    this.selectedImage = null;
    this.editMode.set(false);
    this.selectedArticuloId = null;
  }

  // ===========================
  // ARCHIVO
  // ===========================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedImage = null;
      return;
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      this.mostrarAdvertencia('Formato no permitido.');
      this.selectedImage = null;
      return;
    }

    if (file.size > this.maxFileSize) {
      this.mostrarAdvertencia('Imagen supera los 5MB.');
      this.selectedImage = null;
      return;
    }

    this.selectedImage = file;
    this.mostrarExito('Imagen seleccionada.');
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formArticulo.invalid) return;

    const fd = this.prepararFormData();
    this.submitting.set(true);

    if (this.editMode() && this.selectedArticuloId) {
      this.actualizarArticulo(fd);
    } else {
      this.crearArticulo(fd);
    }
  }

  private prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formArticulo.getRawValue(); // getRawValue para incluir campos disabled

    fd.append('id_revista', v.id_revista != null ? v.id_revista.toString() : '');
    fd.append('titulo', v.titulo);
    fd.append('autor', v.autor);
    if (v.pagina != null) fd.append('pagina', v.pagina.toString());
    fd.append('contenido', v.contenido);
    fd.append('estatus', v.estatus);

    if (this.selectedImage) {
      fd.append('imagen', this.selectedImage);
    }

    return fd;
  }

  // ===========================
  // CRUD ACTIONS
  // ===========================
  private crearArticulo(fd: FormData): void {
    this.api
      .crearArticulo(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Actualizamos el signal -> Computed se recalcula solo -> Vista se actualiza
            this.articulos.update((arts) => [res.data, ...arts]);
            this.cerrarModal();
            this.mostrarExito('Artículo creado.');
          }
          this.submitting.set(false);
        },
        error: () => {
          this.mostrarError('Error al crear artículo');
          this.submitting.set(false);
        },
      });
  }

  private actualizarArticulo(fd: FormData): void {
    this.api
      .actualizarArticulo(this.selectedArticuloId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Actualizamos el signal de forma inmutable
            this.articulos.update((arts) =>
              arts.map((a) =>
                a.id_articulo === this.selectedArticuloId
                  ? { ...a, ...this.formArticulo.getRawValue() }
                  : a
              )
            );
            this.cerrarModal();
            this.mostrarExito('Artículo actualizado.');
          }
          this.submitting.set(false);
        },
        error: () => {
          this.mostrarError('Error al actualizar artículo');
          this.submitting.set(false);
        },
      });
  }

  // ===========================
  // UTILS
  // ===========================
  verContenido(a: Articulos): void {
    this.contenidoVista = a.contenido;
    this.modalContenidoVisible.set(true);
  }

  getImageUrl(a: Articulos): string {
    // Tip: Mover la URL base a environments
    return `http://localhost:3000/public/articulos/${a.id_articulo}/${a.imagen}`;
  }

  getEstatusLabel(e: string): string {
    return e === 'A' ? 'Activo' : 'Inactivo';
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
