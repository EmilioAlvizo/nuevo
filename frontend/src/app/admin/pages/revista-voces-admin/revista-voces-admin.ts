import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-revista-voces-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revista-voces-admin.html',
  styleUrls: ['./revista-voces-admin.css']
})
export class RevistaVocesAdmin implements OnInit, AfterViewInit {
  @ViewChild('modalRevista') modalElement!: ElementRef;

  revistas: Revistas[] = [];
  nuevaRevista: any = this.vaciaRevista();
  editando: boolean = false;
  private modalInstance: any;
  private bsModule: any;

  constructor(
    private apiRevistas: ApiRevistas,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarRevistas();

    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(bs => {
        this.bsModule = bs;
        if (this.modalElement) this.inicializarModal();
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.bsModule) {
      this.inicializarModal();
    }
  }

  private vaciaRevista() {
    return {
      id_revista: null,
      volumen: '',
      numero_year: '',
      descripcion: '',
      fecha: '',
      estatus: '',
      portada: '',
      archivo: ''
    };
  }

  private inicializarModal(): void {
    if (!this.modalElement) return;
    const Modal = this.bsModule.Modal;
    this.modalInstance = new Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
    this.modalElement.nativeElement.addEventListener('hidden.bs.modal', () => {
      this.resetFormulario();
    });
  }


  abrirModal(): void {
    this.editando = false;
    this.nuevaRevista = this.vaciaRevista();
    this.portadaPreview = null;
    this.archivoNombre = null;
    this.modalInstance?.show();
  }

  cerrarModal(): void {
    this.portadaPreview = null;
    this.archivoNombre = null;
    this.modalInstance?.hide();
  }

  cargarRevistas(): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (res) => this.revistas = res.data || [],
      error: (err) => console.error('Error al obtener revistas:', err)
    });
  }

  portadaPreview: string | null = null;
  archivoNombre: string | null = null;

  onFileSelected(event: any, tipo: 'portada' | 'archivo'): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo según el campo
    if (tipo === 'portada' && !file.type.startsWith('image/')) {
      Swal.fire('Error', 'Solo se permiten imágenes para la portada.', 'error');
      event.target.value = ''; // Limpiar input
      return;
    }

    if (tipo === 'archivo' && file.type !== 'application/pdf') {
      Swal.fire('Error', 'Solo se permiten archivos PDF.', 'error');
      event.target.value = ''; // Limpiar input
      return;
    }

    // Guardar el archivo
    this.nuevaRevista[tipo] = file;

    // Crear preview para portada
    if (tipo === 'portada') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.portadaPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Guardar nombre del archivo PDF
    if (tipo === 'archivo') {
      this.archivoNombre = file.name;
    }
  }

  guardarRevista(form: any): void {
    if (!form.valid) return;
    
    if (this.editando) {
      const formData = new FormData();
      
      // Agregar campos de texto
      formData.append('volumen', this.nuevaRevista.volumen);
      formData.append('numero_year', this.nuevaRevista.numero_year);
      formData.append('descripcion', this.nuevaRevista.descripcion);
      formData.append('fecha', this.nuevaRevista.fecha);
      formData.append('estatus', this.nuevaRevista.estatus);
      
      // Solo agregar archivos si se seleccionaron nuevos
      if (this.nuevaRevista.portada instanceof File) {
        formData.append('portada', this.nuevaRevista.portada, this.nuevaRevista.portada.name);
      }
      
      if (this.nuevaRevista.archivo instanceof File) {
        formData.append('archivo', this.nuevaRevista.archivo, this.nuevaRevista.archivo.name);
      }

      this.apiRevistas.actualizarRevista(this.nuevaRevista.id_revista, formData).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Actualizado', 'La revista se actualizó correctamente.', 'success');
            this.cargarRevistas();
            this.cerrarModal();
          } else {
            Swal.fire('Error', res.message || 'No se pudo actualizar.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al actualizar revista:', err);
          Swal.fire('Error', 'Error al actualizar la revista.', 'error');
        }
      });
    } else {
      // Crear (tu código actual está bien)
      const nueva = { ...this.nuevaRevista };
      delete nueva.id_revista;

      const formData = new FormData();
      for (const [key, value] of Object.entries(nueva)) {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value, value.name);
          } else {
            formData.append(key, value as string);
          }
        }
      }

      this.apiRevistas.crearRevista(formData).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Creado', 'La revista se creó correctamente.', 'success');
            this.cargarRevistas();
            this.cerrarModal();
          } else {
            Swal.fire('Error', res.message || 'No se pudo crear.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al crear revista:', err);
          Swal.fire('Error', 'Error al crear la revista.', 'error');
        }
      });
    }
  }

  editarRevista(revista: any) {
  this.editando = true;

  // Formatear la fecha
  const fechaFormateada = this.formatDateForInput(revista.fecha);

  this.nuevaRevista = {
    ...revista,
    fecha: fechaFormateada
  };

  // Limpiar previews de archivos nuevos
  this.portadaPreview = null;
  this.archivoNombre = null;
  this.modalInstance?.show();
}

  formatDateForInput(fechaISO: string | Date): string {
    return fechaISO.toString().substring(0, 10);
  }

  private resetFormulario(): void {
    this.nuevaRevista = this.vaciaRevista();
    this.editando = false;
    this.portadaPreview = null;
    this.archivoNombre = null;
  }

}