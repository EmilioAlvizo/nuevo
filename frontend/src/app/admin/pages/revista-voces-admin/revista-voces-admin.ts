import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../services/revistas';
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
    this.modalInstance?.show();
  }

  cerrarModal(): void {
    this.modalInstance?.hide();
  }

  cargarRevistas(): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (res) => this.revistas = res.data || [],
      error: (err) => console.error('Error al obtener revistas:', err)
    });
  }

  guardarRevista(form: any): void {
    if (!form.valid) return;
    if (this.editando) {
      const payload = { ...this.nuevaRevista };
      // Opcional: quitar id_revista del payload si ya está en la URL
      delete payload.id_revista;

      this.apiRevistas.actualizarRevista(this.nuevaRevista.id_revista, payload).subscribe({
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
      // Crear
      const nueva = { ...this.nuevaRevista };
      delete nueva.id_revista;

      const formData = new FormData();
      Object.entries(nueva).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, value as string);
      });

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

    // Formatear la fecha para que sea compatible con <input type="date">
    const fechaFormateada = this.formatDateForInput(revista.fecha);

    this.nuevaRevista = {
      ...revista,
      fecha: fechaFormateada  // reemplaza la fecha ISO por yyyy-MM-dd
    };

    this.modalInstance?.show();
  }

  formatDateForInput(fechaISO: string | Date): string {
    const fecha = new Date(fechaISO);
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  eliminarRevista(id: number): void {
    Swal.fire({
      title: '¿Eliminar revista?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed) {
        this.apiRevistas.eliminarRevista(id).subscribe({
          next: (res) => {
            if (res.success) {
              Swal.fire('Eliminada', 'La revista fue eliminada.', 'success');
              this.cargarRevistas();
            } else {
              Swal.fire('Error', res.message || 'No se pudo eliminar.', 'error');
            }
          },
          error: () => Swal.fire('Error', 'Error al eliminar la revista.', 'error')
        });
      }
    });
  }

  private resetFormulario(): void {
    this.nuevaRevista = this.vaciaRevista();
    this.editando = false;
  }
}