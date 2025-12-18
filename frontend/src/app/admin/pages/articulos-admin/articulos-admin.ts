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
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
import { TextareaModule } from 'primeng/textarea';

import { ApiArticulosRevista, ArticulosRevista } from '../../../core/services/articulos_revista';
import { ApiArticulosIndependientes, ArticulosIndependientes } from '../../../core/services/articulos';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';

interface StatusOption {
  label: string;
  value: string;
}

// Interfaz unificada para ambos tipos de artículos
interface ArticuloUnificado {
  id_articulo: number;
  id_revista?: number | null;
  titulo: string;
  autor: string;
  contenido: string;
  pagina?: number;
  imagen: string;
  archivo?: string;
  estatus: string;
  fecha_modificacion: string;
  tipo: 'revista' | 'independiente'; // Campo para identificar la fuente
}

// Interfaz para el agrupamiento
interface GroupedArticulo {
  revista: Revistas | null;
  articulos: ArticuloUnificado[];
}

@Component({
  selector: 'app-articulos-admin',
  standalone: true,
  templateUrl: './articulos-admin.html',
  styleUrls: ['./articulos-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TextareaModule
  ],
})
export class ArticulosAdmin implements OnInit, OnDestroy {
  // ======================================================
  // INYECCIÓN
  // ======================================================
  private apiRevista = inject(ApiArticulosRevista);
  private apiIndependiente = inject(ApiArticulosIndependientes);
  private apiRevistas = inject(ApiRevistas);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private datePipe = inject(DatePipe);

  publicUrl = environment.publicUrl;

  // ===========================
  // Estado (Signals)
  // ===========================
  articulosUnificados = signal<ArticuloUnificado[]>([]);
  revistas = signal<Revistas[]>([]);

  // Estado de UI
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  modalContenidoVisible = signal<boolean>(false);
  editMode = signal<boolean>(false);

  // Variables simples
  selectedArticuloId: number | null = null;
  selectedArticuloTipo: 'revista' | 'independiente' | null = null;
  selectedImage: File | null = null;
  selectedArchivo: File | null = null;
  contenidoVista: string | null = null;

  // ===========================
  // Estado Derivado (Computed)
  // ===========================

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

  revistasOptionsConNulo = computed(() => {
    return [{ label: 'Sin revista (artículo independiente)', value: null }, ...this.revistasOptions()];
  });

  groupedArticulos = computed<GroupedArticulo[]>(() => {
    const currentRevistas = this.revistas();
    const currentArticulos = this.articulosUnificados();

    if (currentArticulos.length === 0) return [];

    const articulosSinRevista = currentArticulos.filter((a) => !a.id_revista);

    const agrupados = currentRevistas.map((rev) => ({
      revista: rev,
      articulos: currentArticulos.filter((a) => a.id_revista === rev.id_revista),
    }));

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

    this.apiRevistas
      .getRevistas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.revistas.set(res.data);
          this.cargarArticulos();
        },
        error: () => {
          this.mostrarError('Error al cargar revistas');
          this.cargarArticulos();
        },
      });
  }

  cargarArticulos(): void {
    // Cargar ambos tipos de artículos en paralelo
    forkJoin({
      revista: this.apiRevista.getArticulos(),
      independiente: this.apiIndependiente.getArticulos()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        // Unificar artículos
        const articulosRevista: ArticuloUnificado[] = res.revista.data.map(a => ({
          ...a,
          tipo: 'revista' as const
        }));

        const articulosIndependientes: ArticuloUnificado[] = res.independiente.data.map(a => ({
          ...a,
          id_revista: null,
          tipo: 'independiente' as const
        }));

        this.articulosUnificados.set([...articulosRevista, ...articulosIndependientes]);
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

  // private setupFormListeners(): void {
  //   this.formArticulo
  //     .get('id_revista')
  //     ?.valueChanges.pipe(takeUntil(this.destroy$))
  //     .subscribe((idRevista) => {
  //       const paginaControl = this.formArticulo.get('pagina');
  //       if (idRevista) {
  //         // Es artículo de revista
  //         paginaControl?.enable();
  //         paginaControl?.setValidators([Validators.required, Validators.min(1)]);
  //       } else {
  //         // Es artículo independiente
  //         paginaControl?.disable();
  //         paginaControl?.clearValidators();
  //         paginaControl?.setValue(null);
  //       }
  //       paginaControl?.updateValueAndValidity();
  //     });
  // }

  
  private setupFormListeners(): void {
    this.formArticulo
      .get('id_revista')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((idRevista) => {
        const paginaControl = this.formArticulo.get('pagina');
        
        if (idRevista) {
          // Es artículo de revista
          paginaControl?.enable();
          paginaControl?.setValidators([Validators.required, Validators.min(1)]);
          
          // ✅ Limpiar archivo PDF si había uno seleccionado
          this.selectedArchivo = null;
        } else {
          // Es artículo independiente
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
  abrirModal(art?: ArticuloUnificado): void {
    this.modalVisible.set(true);

    if (art) {
      this.editMode.set(true);
      this.selectedArticuloId = art.id_articulo;
      this.selectedArticuloTipo = art.tipo;
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
      this.selectedArticuloTipo = null;
      this.formArticulo.reset({ estatus: 'A' });
      this.selectedImage = null;
      this.selectedArchivo = null;
    }
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formArticulo.reset({ estatus: 'A' });
    this.selectedImage = null;
    this.selectedArchivo = null;
    this.editMode.set(false);
    this.selectedArticuloId = null;
    this.selectedArticuloTipo = null;
  }

  // ===========================
  // ARCHIVOS
  // ===========================
  onFileSelected(event: Event, tipo: 'imagen' | 'archivo'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      if (tipo === 'imagen') this.selectedImage = null;
      else this.selectedArchivo = null;
      return;
    }

    if (tipo === 'imagen') {
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
    } else {
      if (file.type !== 'application/pdf') {
        this.mostrarAdvertencia('Solo se permiten archivos PDF.');
        this.selectedArchivo = null;
        return;
      }
      if (file.size > this.maxFileSize) {
        this.mostrarAdvertencia('Archivo supera los 5MB.');
        this.selectedArchivo = null;
        return;
      }
      this.selectedArchivo = file;
      this.mostrarExito('Archivo PDF seleccionado.');
    }
  }

  // ===========================
  // SUBMIT
  // ===========================
  submitForm(): void {
    if (this.formArticulo.invalid) return;

    const fd = this.prepararFormData();
    this.submitting.set(true);

    const idRevista = this.formArticulo.getRawValue().id_revista;
    const tipoArticulo: 'revista' | 'independiente' = idRevista ? 'revista' : 'independiente';

    if (this.editMode() && this.selectedArticuloId) {
      this.actualizarArticulo(fd, this.selectedArticuloTipo!);
    } else {
      this.crearArticulo(fd, tipoArticulo);
    }
  }

  // private prepararFormData(): FormData {
  //   const fd = new FormData();
  //   const v = this.formArticulo.getRawValue();

  //   const idRevista = v.id_revista;

  //   if (idRevista) {
  //     // Artículo de revista
  //     fd.append('id_revista', idRevista.toString());
  //     fd.append('pagina', v.pagina.toString());
  //   }

  //   fd.append('titulo', v.titulo);
  //   fd.append('autor', v.autor);
  //   fd.append('contenido', v.contenido);
  //   fd.append('estatus', v.estatus);

  //   if (this.selectedImage) {
  //     fd.append('imagen', this.selectedImage);
  //   }

  //   if (this.selectedArchivo) {
  //     fd.append('archivo', this.selectedArchivo);
  //   }

  //   return fd;
  // }

  private prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formArticulo.getRawValue();

    const idRevista = v.id_revista;
    const esArticuloRevista = !!idRevista; // true si es de revista, false si es independiente

    if (esArticuloRevista) {
      // Artículo de revista
      fd.append('id_revista', idRevista.toString());
      fd.append('pagina', v.pagina.toString());
    }

    fd.append('titulo', v.titulo);
    fd.append('autor', v.autor);
    fd.append('contenido', v.contenido);
    fd.append('estatus', v.estatus);

    // ✅ Imagen siempre se envía (ambos tipos la requieren)
    if (this.selectedImage) {
      fd.append('imagen', this.selectedImage);
    }

    // ✅ Archivo SOLO para artículos independientes
    if (!esArticuloRevista && this.selectedArchivo) {
      fd.append('archivo', this.selectedArchivo);
    }

    return fd;
  }

  // ===========================
  // CRUD ACTIONS
  // ===========================
  private crearArticulo(fd: FormData, tipo: 'revista' | 'independiente'): void {
    const api = tipo === 'revista' ? this.apiRevista : this.apiIndependiente;

    api.crearArticulo(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const nuevoArticulo: ArticuloUnificado = { ...res.data, tipo };
            this.articulosUnificados.update((arts) => [nuevoArticulo, ...arts]);
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

  private actualizarArticulo(fd: FormData, tipo: 'revista' | 'independiente'): void {
    const api = tipo === 'revista' ? this.apiRevista : this.apiIndependiente;

    api.actualizarArticulo(this.selectedArticuloId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.articulosUnificados.update((arts) =>
              arts.map((a) =>
                a.id_articulo === this.selectedArticuloId && a.tipo === tipo
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
  verContenido(a: ArticuloUnificado): void {
    this.contenidoVista = a.contenido;
    this.modalContenidoVisible.set(true);
  }

  getImageUrl(a: ArticuloUnificado): string {
    const carpeta = a.tipo === 'revista' ? 'articulos_revista' : 'articulos';
    const subcarpeta = a.tipo === 'revista' ? '' : '/imagen';
    return `${this.publicUrl}/${carpeta}/${a.id_articulo}${subcarpeta}/${a.imagen}`;
  }

  getArchivoUrl(a: ArticuloUnificado): string | null {
    if (a.tipo !== 'independiente' || !a.archivo) return null;
    return `${this.publicUrl}/articulos/${a.id_articulo}/archivo/${a.archivo}`;
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