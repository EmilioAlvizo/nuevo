// import { Component, OnInit } from '@angular/core';
// import { ApiRevistas, Revistas } from '../../../services/revistas';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';

// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap';

// @Component({
//   selector: 'app-revista-voces-admin',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './revista-voces-admin.html',
//   styleUrl: './revista-voces-admin.css'
// })
// export class RevistaVocesAdmin implements OnInit {

// revistas: Revistas[] = [];
// archivos: { portada?: File; archivo?: File} = {}

//   constructor(private apiRevistas: ApiRevistas, private router: Router) {}

//   ngOnInit(): void {
//     this.cargarRevistas();
//   }

//   cargarRevistas(): void {
//     this.apiRevistas.getRevistas().subscribe({
//       next: (response) => {
//         if (response.success && response.data) {
//           this.revistas = response.data;
//         }
//       },
//       error: (error) => {
//         console.error('Error al obtener revistas:', error);
//       }
//     });
//   }

//   // abrirRevista(revista: Revistas): void {
//   //   this.router.navigate(['/revista', revista.id_revista]);
//   // }

//   // Capturar archivos
//   // onFileSelected(event: any, tipo: 'portada' | 'archivo') {
//   //   const file = event.target.files[0];
//   //   if (file) {
//   //     this.archivos[tipo] = file;
//   //   }
//   // }

//   // Guardar revista
// //   guardarRevista(form: any): void {
// //   if (!form.valid) return;

// //   const formData = new FormData();
// //   formData.append('volumen', form.value.volumen);
// //   formData.append('numero_year', form.value.numero_year);
// //   formData.append('descripcion', form.value.descripcion);
// //   formData.append('fecha', form.value.fecha);
// //   formData.append('estatus', form.value.estatus);

// //   if (this.archivos.portada) formData.append('portada', this.archivos.portada);
// //   if (this.archivos.archivo) formData.append('archivo', this.archivos.archivo);

// //   this.apiRevistas.crearRevista(formData).subscribe({
// //     next: (res: any) => {
// //       if (res.success) {
// //         this.cargarRevistas();
// //         form.resetForm();
// //         this.archivos = {};

// //         const modal: any = document.getElementById('agregarRevista');
// //         const bsModal = bootstrap.Modal.getInstance(modal);
// //         bsModal?.hide();

// //         alert('✅ Revista creada correctamente');
// //       } else {
// //         alert('❌ Error al crear revista');
// //       }
// //     },
// //     error: (err) => console.error('Error en API:', err)
// //   });
// // }


// }