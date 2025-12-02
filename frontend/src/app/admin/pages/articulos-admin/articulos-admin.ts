import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

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

@Component({
  selector: 'app-articulos-admin',
  standalone: true,
  templateUrl: './articulos-admin.html',
  styleUrls: ['./articulos-admin.css'],
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
    AccordionModule
  ]
})
export class ArticulosAdmin implements OnInit, OnDestroy {

  // ===========================
  // Datos
  // ===========================
  articulos: Articulos[] = [];
  revistas: Revistas[] = [];

  revistasOptions: any[] = [];

  revistasOptionsConNulo: any[] = [];

  groupedArticulos: any[] = [];

  formArticulo!: FormGroup;

  modalVisible = false;
  editMode = false;
  selectedArticuloId: number | null = null;

  selectedImage: File | null = null;
  submitting = false;
  loading = false;

  allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  maxFileSize = 5 * 1024 * 1024;

  estatusOptions: StatusOption[] = [
    { label: 'Activo', value: 'A' },
    { label: 'Inactivo', value: 'B' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiArticulos,
    private apiRevistas: ApiRevistas,
    private fb: FormBuilder,
    private msg: MessageService,
    private confirm: ConfirmationService,
    private datePipe: DatePipe
  ) {
    this.inicializarFormulario();
  }

  // ngOnInit(): void {
  //   this.cargarRevistas();
  //   this.cargarArticulos();
    
  //   this.formArticulo.get('id_revista')?.valueChanges
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((idRevista) => {
  //       const paginaControl = this.formArticulo.get('pagina');

  //       if (idRevista) {
  //         // Si hay revista, habilitar y hacer obligatorio
  //         paginaControl?.enable();
  //         paginaControl?.setValidators([Validators.required, Validators.min(1)]);
  //       } else {
  //         // Si no hay revista, deshabilitar y limpiar validaciones
  //         paginaControl?.disable();
  //         paginaControl?.clearValidators();
  //         paginaControl?.setValue(null);
  //       }

  //       paginaControl?.updateValueAndValidity();
  //     });

  // }

  ngOnInit(): void {
  this.loading = true;

  this.apiRevistas.getRevistas()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.revistas = res.data || [];

        this.revistasOptionsConNulo = [
          { label: 'Sin revista', value: null },
          ...this.revistas.map(r => ({
            label: `Vol. ${r.volumen} - Núm. ${r.numero_year}`,
            value: r.id_revista
          }))
        ];

        // Ahora que ya tenemos revistas, cargamos artículos
        this.cargarArticulos();
      },
      error: () => {
        this.mostrarError('Error al cargar revistas');
        // Aunque falle, cargamos artículos para que no se quede vacío
        this.cargarArticulos();
      }
    });

  this.formArticulo.get('id_revista')?.valueChanges
    .pipe(takeUntil(this.destroy$))
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


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================
  // FORM
  // ===========================
  private inicializarFormulario(): void {
    this.formArticulo = this.fb.group({
      id_revista: [null],
      titulo: ['', Validators.required],
      autor: ['', Validators.required],
      contenido: ['', Validators.required],
      estatus: ['A', Validators.required],
      pagina: [{value: null, disabled: true}]
    });
  }

  // ===========================
  // CARGA DE REVISTAS
  // ===========================
  // cargarRevistas() {
  //   this.apiRevistas.getRevistas()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (res) => {
  //         this.revistas = res.data || [];
  //           this.revistasOptions = this.revistas.map(r => ({
  //             label: `Vol. ${r.volumen} - Núm. ${r.numero_year} (${this.datePipe.transform(r.fecha, 'dd/MM/yyyy', 'UTC')})`,
  //             value: r.id_revista
  //           }));
  //       },
  //       error: () => {
  //         this.mostrarError('Error al cargar revistas');
  //       }
  //     });
  // }
  cargarRevistas() {
  this.apiRevistas.getRevistas()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.revistas = res.data || [];

        this.revistasOptions = this.revistas.map(r => ({
          label: `Vol. ${r.volumen} - Núm. ${r.numero_year} (${this.datePipe.transform(r.fecha, 'dd/MM/yyyy', 'UTC')})`,
          value: r.id_revista
        }));

        this.revistasOptionsConNulo = [
          { label: 'Sin revista', value: null },
          ...this.revistasOptions
        ];
      },
      error: () => {
        this.mostrarError('Error al cargar revistas');
      }
    });
}


  // ===========================
  // CARGA DE ARTÍCULOS
  // ===========================
  cargarArticulos(): void {
    this.loading = true;
    this.api.getArticulos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.articulos = res.data || [];
          this.groupArticulos();
          this.loading = false;
        },
        error: () => {
          this.mostrarError('Error al cargar artículos');
          this.loading = false;
        }
      });
  }

  // ===========================
  // AGRUPAR ARTÍCULOS POR REVISTA
  // ===========================
  // groupArticulos() {
  //   this.groupedArticulos = this.revistas.map(rev => ({
  //     revista: rev,
  //     articulos: this.articulos.filter(a => a.id_revista === rev.id_revista)
  //   }));
  // }
  groupArticulos() {
  const articulosSinRevista = this.articulos.filter(a => !a.id_revista);

  this.groupedArticulos = [
    ...this.revistas.map(rev => ({
      revista: rev,
      articulos: this.articulos.filter(a => a.id_revista === rev.id_revista)
    })),
    {
      revista: null,
      articulos: articulosSinRevista
    }
  ];
}


  // ===========================
  // MODAL
  // ===========================
  abrirModal(art?: Articulos): void {
    this.modalVisible = true;

    if (art) {
      this.editMode = true;
      this.selectedArticuloId = art.id_articulo;

      this.formArticulo.patchValue({
        id_revista: art.id_revista,
        titulo: art.titulo,
        autor: art.autor,
        pagina: art.pagina,
        contenido: art.contenido,
        estatus: art.estatus
      });
    } else {
      this.editMode = false;
      this.selectedArticuloId = null;
      this.formArticulo.reset({ estatus: 'A' });
      this.selectedImage = null;
    }
  }

  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => this.vaciarFormulario(), 200);
  }

  vaciarFormulario(): void {
    this.formArticulo.reset({ estatus: 'A' });
    this.selectedImage = null;
    this.editMode = false;
    this.selectedArticuloId = null;
  }

  // ===========================
  // ARCHIVO
  // ===========================
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];

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

  submitForm() {
    if (this.formArticulo.invalid) {
      return;
    }

    const fd = this.prepararFormData();
    this.submitting = true;

    if (this.editMode && this.selectedArticuloId) {
      this.actualizarArticulo(fd);
    } else {
      this.crearArticulo(fd);
    }
  }


  // private prepararFormData(): FormData {
  //   const fd = new FormData();
  //   const v = this.formArticulo.value;

  //   // fd.append('id_revista', v.id_revista.toString());
  //   if (v.id_revista != null) {
  //     fd.append('id_revista', v.id_revista.toString());
  //   } else {
  //     fd.append('id_revista', '');
  //   }
  //   fd.append('titulo', v.titulo);
  //   fd.append('autor', v.autor);
  //   fd.append('pagina', v.pagina.toString());
  //   fd.append('contenido', v.contenido);
  //   fd.append('estatus', v.estatus);

  //   if (this.selectedImage) fd.append('imagen', this.selectedImage);

  //   return fd;
  // }

  private prepararFormData(): FormData {
    const fd = new FormData();
    const v = this.formArticulo.value;

    // id_revista puede ser null
    fd.append('id_revista', v.id_revista != null ? v.id_revista.toString() : '');

    fd.append('titulo', v.titulo);
    fd.append('autor', v.autor);

    // Solo agregar pagina si tiene valor
    if (v.pagina != null) {
      fd.append('pagina', v.pagina.toString());
    }

    fd.append('contenido', v.contenido);
    fd.append('estatus', v.estatus);

    if (this.selectedImage) {
      fd.append('imagen', this.selectedImage);
    }

    return fd;
  }


  // ===========================
  // CRUD
  // ===========================
  private crearArticulo(fd: FormData): void {
    this.api.crearArticulo(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.articulos.unshift(res.data);
            this.groupArticulos();
            this.cerrarModal();
            this.mostrarExito('Artículo creado.');
          }
          this.submitting = false;
        },
        error: () => {
          this.mostrarError('Error al crear artículo');
          this.submitting = false;
        }
      });
  }

  private actualizarArticulo(fd: FormData): void {
    this.api.actualizarArticulo(this.selectedArticuloId!, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            const index = this.articulos.findIndex(a => a.id_articulo === this.selectedArticuloId);
            if (index !== -1) {
              this.articulos[index] = { ...this.articulos[index], ...this.formArticulo.value };
            }
            this.groupArticulos();
            this.cerrarModal();
            this.mostrarExito('Artículo actualizado.');
          }
          this.submitting = false;
        },
        error: () => {
          this.mostrarError('Error al actualizar artículo');
          this.submitting = false;
        }
      });
  }

  // ===========================
  // VER CONTENIDO
  // ===========================
  contenidoVista: string | null = null;
  modalContenidoVisible = false;

  verContenido(a: Articulos) {
    this.contenidoVista = a.contenido;
    this.modalContenidoVisible = true;
  }

  // ===========================
  // HELPERS
  // ===========================
  getImageUrl(a: Articulos): string {
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
