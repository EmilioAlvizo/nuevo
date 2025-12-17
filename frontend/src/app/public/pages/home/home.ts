//nuevo/frontend/src/app/public/pages/home/home.ts

import { Component, OnInit, inject, PLATFORM_ID, signal, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

import { CarruselTestimonios } from '../../components/carrusel-testimonios/carrusel-testimonios';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';
import { ApiTestimonios, Testimonios } from '../../../core/services/testimonios';
import { environment } from '../../../../environments/environment';
import { ApiTemas, Temas } from '../../../core/services/temas_interes';
import { FormTestimonios } from '../../components/form-testimonios/form-testimonios';
import { FormPropuesta } from '../../components/form-propuesta/form-propuesta';
import { EncuestaActual } from '../../components/encuesta-actual/encuesta-actual';
import { Hero } from '../../components/hero/hero';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AnimateOnScrollModule } from 'primeng/animateonscroll'; // ✅ NUEVO

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CarruselTestimonios,
    FormTestimonios,
    ConfirmDialogModule,
    ToastModule,
    FormPropuesta,
    ButtonModule,
    EncuestaActual,
    AnimateOnScrollModule,
    Hero,
  ],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css',
  encapsulation: ViewEncapsulation.None,
})
export class Home implements OnInit {
  today: number = Date.now();
  municipios: Municipio[] = [];
  //testimonios: Testimonios[] = [];
  //temas: Temas[] = [];

  testimonios = signal<Testimonios[]>([]);
  temas = signal<Temas[]>([]);
  publicUrl = environment.publicUrl;

  private msg = inject(MessageService);
  private apiTestimonios = inject(ApiTestimonios);
  private apiTemas = inject(ApiTemas);

  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  //showDialog = false;
  //showPropuesta = false;
  showDialog = signal(false);
  showPropuesta = signal(false);

  /* abrirDialogo() {
    this.showDialog.set(true);
  }

  abrirDialogoPropuesta() {
    this.showPropuesta.set(true);
  } */

  constructor(private api: ApiMunicipio) { }

  ngOnInit(): void {
    // ⬇ Primera carga desde el servidor
    this.apiTestimonios.getTestimonios().subscribe();

    // ⬇ Suscripción permanente a la lista
    this.apiTestimonios.testimonios$.subscribe((lista) => {
      this.testimonios.set(lista.filter((t: any) => t.estatus === 'A'));
    });
    this.cargarMunicipios();
    this.cargarTemas();
  }

  cargarMunicipios(): void {
    this.api.getMessage().subscribe({
      next: (response) => {
        if (response.success) {
          this.municipios = response.data;
          this.municipios.pop(); // Elimina el último elemento del array
        } else {
          console.error('Error al obtener municipios');
        }
      },
      error: (err) => {
        console.error('Error en la llamada al backend (municipios)', err);
      },
    });
  }

  cargarTestimonios(): void {
    this.apiTestimonios.getTestimonios().subscribe({
      next: (datos) => {
        this.testimonios.set(datos.data.filter((t) => t.estatus === 'A'));
      },
    });
  }

  cargarTemas(): void {
    this.apiTemas.getTemas().subscribe({
      next: (datos) => {
        this.temas.set(datos.data.filter((tema) => tema.estatusTema === 'A'));
      },
      error: (err) => {
        console.error('Error al obtener temas', err);
      },
    });
  }

  guardarTestimonio(fd: FormData) {
    //console.log('💾 guardarTestimonio() llamado desde HOME');

    // Debug: ver qué contiene el FormData
    //console.log('📦 FormData recibido:');
    /* for (let [key, value] of fd.entries()) {
      console.log(`  ${key}:`, value);
    } */

    const id = fd.get('id_testimonio');
    //console.log('🔍 id_testimonio:', id, '(modo:', id ? 'EDIT' : 'CREATE', ')');

    const request = id
      ? this.apiTestimonios.updateTestimonio(Number(id), fd)
      : this.apiTestimonios.createTestimonioPublico(fd);

    request.subscribe({
      next: (response) => {
        //console.log('✅ Respuesta exitosa en HOME:', response);

        this.msg.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Testimonio guardado correctamente',
        });

        this.showDialog.set(false);

        // Esperar un poco y verificar estado
        setTimeout(() => {
          const current = this.apiTestimonios.getCurrentTestimonios();
          //console.log('📊 Estado después de guardar:', current.length, 'testimonios');
          /* console.log(
            '📋 IDs actuales:',
            current.map((t) => t.id_testimonios)
          ); */
        }, 100);
      },
      error: (err) => {
        console.error('❌ Error al guardar testimonio:', err);

        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el testimonio',
        });
      },
    });
  }
}
