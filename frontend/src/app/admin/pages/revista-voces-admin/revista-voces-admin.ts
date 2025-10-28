import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../services/revistas';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { Modal } from 'bootstrap';

@Component({
  selector: 'app-revista-voces-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revista-voces-admin.html',
  styleUrls: ['./revista-voces-admin.css']
})
export class RevistaVocesAdmin implements OnInit {

  revistas: Revistas[] = [];
  archivos: { portada?: File; archivo?: File } = {};
  nuevaRevista = {
    volumen: '',
    numero_year: '',
    descripcion: '',
    fecha: '',
    estatus: ''
  };

   private Modal: any; 

  constructor(
    private apiRevistas: ApiRevistas,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // 🔹 Cargar Bootstrap Modal solo en navegador
    if (isPlatformBrowser(this.platformId)) {
      import('bootstrap').then(bs => {
        this.Modal = bs.Modal;
      }).catch(err => console.error('Error al cargar Bootstrap:', err));
    }
  }

  ngOnInit(): void {
    this.cargarRevistas();
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

//   abrirRevista(revista: Revistas): void {
//     this.router.navigate(['/revista', revista.id_revista]);
//   }

  onFileSelected(event: any, tipo: 'portada' | 'archivo') {
    const file = event.target.files[0];
    if (file) {
      this.archivos[tipo] = file;
    }
  }



  guardarRevista(form: any): void {
    if (!form.valid) return;

    const formData = new FormData();
    formData.append('volumen', form.value.volumen);
    formData.append('numero_year', form.value.numero_year);
    formData.append('descripcion', form.value.descripcion);
    formData.append('fecha', form.value.fecha);
    formData.append('estatus', form.value.estatus);

    if (this.archivos.portada) formData.append('portada', this.archivos.portada);
    if (this.archivos.archivo) formData.append('archivo', this.archivos.archivo);

    this.apiRevistas.crearRevista(formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.cargarRevistas();
          form.resetForm();
          this.archivos = {};
          this.nuevaRevista = { volumen: '', numero_year: '', descripcion: '', fecha: '', estatus: '' };

        //   ✅ Solo se ejecuta en el navegador
          if (isPlatformBrowser(this.platformId)) {
            const modal = document.getElementById('agregarRevista');
            if (modal && this.Modal) {
              const bsModal = this.Modal.getInstance(modal) || new this.Modal(modal);
              bsModal.hide();
            }
            alert('✅ Revista creada correctamente');
          }

//         if (isPlatformBrowser(this.platformId) && this.Modal) {
//   const modalEl = document.getElementById('agregarRevista');
//   if (modalEl) {
//     const bsModal = new this.Modal(modalEl);
//     bsModal.show();

//     // Opcional: enfocar un input al abrir
//     setTimeout(() => {
//       const input = modalEl.querySelector<HTMLInputElement>('input[name="volumen"]');
//       input?.focus();
//     }, 200);
//   }
// }



        } else {
          if (isPlatformBrowser(this.platformId)) alert('❌ Error al crear revista');
        }
      },
      error: (err) => console.error('Error en API:', err)
    });
  }
  
}