import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../services/revistas';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
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
  nuevaRevista = {
    volumen: '',
    numero_year: '',
    descripcion: '',
    fecha: '',
    estatus: '',
    portada: '',
    archivo: ''
  };

  private modalInstance: any;
  private bsModule: any; // Módulo dinámico de Bootstrap

  constructor(
    private apiRevistas: ApiRevistas,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarRevistas();

    // Solo en navegador, carga Bootstrap dinámicamente
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(bs => {
        this.bsModule = bs; // guardamos la referencia
        // Si la vista ya está disponible, inicializamos el modal
        if (this.modalElement) {
          this.inicializarModal();
        }
      }).catch(err => console.error('❌ Error al cargar Bootstrap:', err));
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Si Bootstrap ya está cargado, inicializamos ahora
      if (this.bsModule) {
        this.inicializarModal();
      }
    }
  }

  private inicializarModal(): void {
    if (!this.modalElement) return;
    const Modal = this.bsModule.Modal;

    this.modalInstance = new Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });

    // Limpia formulario al cerrar modal
    this.modalElement.nativeElement.addEventListener('hidden.bs.modal', () => {
      this.nuevaRevista = {
        volumen: '',
        numero_year: '',
        descripcion: '',
        fecha: '',
        estatus: '',
        archivo: '',
        portada: ''
      };
    });
  }

  abrirModal(): void {
    if (this.modalInstance) {
      this.modalInstance.show();
    } else {
      console.warn('⚠️ Modal no inicializado todavía.');
    }
  }

  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  cargarRevistas(): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.revistas = response.data;
        }
      },
      error: (error) => console.error('Error al obtener revistas:', error)
    });
  }

  guardarRevista(form: any): void {
    if (!form.valid) return;

    const formData = new FormData();
    Object.entries(form.value).forEach(([k, v]) => formData.append(k, v as string));

    this.apiRevistas.crearRevista(formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.cargarRevistas();
          this.cerrarModal();

          Swal.fire({
            title: '¡Éxito!',
            text: 'La revista se creó correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#198754'
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear la revista.',
            icon: 'error',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#dc3545'
          });
        }
      },
      error: (err) => {
        console.error('Error en API:', err);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un problema con la conexión al servidor.',
          icon: 'error',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }
}



  // guardarRevista(form: any): void {
  //   if (!form.valid) return;

  //   const formData = new FormData();
  //   formData.append('volumen', form.value.volumen);
  //   formData.append('numero_year', form.value.numero_year);
  //   formData.append('descripcion', form.value.descripcion);
  //   formData.append('fecha', form.value.fecha);
  //   formData.append('estatus', form.value.estatus);

  //   formData.append('archivo', form.value.archivo);
  //   formData.append('portada', form.value.portada);


  //   this.apiRevistas.crearRevista(formData).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.cargarRevistas();
  //         form.resetForm();
  //         this.nuevaRevista = { volumen: '', numero_year: '', descripcion: '', fecha: '', estatus: '', archivo: '', portada: '' };

  //       //   ✅ Solo se ejecuta en el navegador
  //         if (isPlatformBrowser(this.platformId)) {
  //           const modal = document.getElementById('agregarRevista');
  //           if (modal && this.Modal) {
  //             const bsModal = this.Modal.getInstance(modal) || new this.Modal(modal);
  //             bsModal.hide();
  //           }
  //           alert('✅ Revista creada correctamente');
  //         }

  //       } else {
  //         if (isPlatformBrowser(this.platformId)) alert('❌ Error al crear revista');
  //       }
  //     },
  //     error: (err) => console.error('Error en API:', err)
  //   });
  // }
