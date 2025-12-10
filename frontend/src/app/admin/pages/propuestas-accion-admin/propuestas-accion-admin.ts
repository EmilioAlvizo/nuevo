import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';

import { ApiPropuesta, Propuesta } from '../../../core/services/propuestas_accion';
import { ApiMunicipio, Municipio } from '../../../core/services/municipios';

@Component({
  selector: 'app-propuestas-accion-admin',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    AccordionModule
  ],
  providers: [MessageService],
  templateUrl: './propuestas-accion-admin.html',
  styleUrls: ['./propuestas-accion-admin.css']
})
export class PropuestasAccionAdmin implements OnInit, OnDestroy {

  propuestas: Propuesta[] = [];
  municipios: Municipio[] = [];
  loading: boolean = false;
  
  // 🎯 Signal para manejar el resaltado
  propuestaResaltada = signal<number | null>(null);

  private destroy$ = new Subject<void>();

  constructor(
    private apiPropuesta: ApiPropuesta,
    private apiMunicipio: ApiMunicipio,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarMunicipios();
    this.cargarPropuestas();
    
    // 🔔 Escuchar parámetro de query para resaltar
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const highlightId = params['highlight'];
        if (highlightId) {
          // Esperar a que se carguen las propuestas
          setTimeout(() => {
            this.resaltarPropuesta(Number(highlightId));
          }, 500);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // Cargar propuestas
  // ============================================================
  cargarPropuestas(): void {
    this.loading = true;

    this.apiPropuesta.getPropuestas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.propuestas = res.data;
            
            // Si hay un highlight pendiente, aplicarlo después de cargar
            const highlightId = this.route.snapshot.queryParams['highlight'];
            if (highlightId) {
              setTimeout(() => {
                this.resaltarPropuesta(Number(highlightId));
              }, 300);
            }
          } else {
            this.mostrarError('Error al cargar las propuestas.');
          }
          this.loading = false;
        },
        error: () => {
          this.mostrarError('No se pudieron cargar las propuestas.');
          this.loading = false;
        }
      });
  }

  cargarMunicipios(): void {
    this.apiMunicipio.getMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.municipios = res.data;
          } else {
            this.mostrarError('Error al cargar los municipios.');
          }
        },
        error: () => {
          this.mostrarError('No se pudieron cargar los municipios.');
        }
      });
  }

  // ============================================================
  // 🎯 Resaltar propuesta específica
  // ============================================================
  resaltarPropuesta(idPropuesta: number): void {
    console.log('🎯 Resaltando propuesta:', idPropuesta);
    
    // Marcar como resaltada
    this.propuestaResaltada.set(idPropuesta);

    // Hacer scroll al elemento
    setTimeout(() => {
      const elemento = document.getElementById(`propuesta-${idPropuesta}`);
      
      if (elemento) {
        // Scroll suave al elemento
        elemento.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });

        // Abrir el accordion si está usando PrimeNG Accordion
        const accordionHeader = elemento.closest('.p-accordion-header');
        if (accordionHeader && !accordionHeader.classList.contains('p-accordion-header-active')) {
          (accordionHeader as HTMLElement).click();
        }

        console.log('✅ Scroll completado a propuesta:', idPropuesta);
      } else {
        console.warn('⚠️ No se encontró el elemento con ID:', `propuesta-${idPropuesta}`);
      }
    }, 200);

    // Quitar el resaltado después de 4 segundos
    setTimeout(() => {
      this.propuestaResaltada.set(null);
    }, 4000);
  }

  // ============================================================
  // Verificar si una propuesta está resaltada
  // ============================================================
  esPropuestaResaltada(idPropuesta: number): boolean {
    return this.propuestaResaltada() === idPropuesta;
  }

  // ============================================================
  // Mensajes
  // ============================================================
  mostrarError(mensaje: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje,
      life: 3500
    });
  }

  // ============================================================
  // Método para obtener nombre del municipio por ID
  // ============================================================
  getNombreMunicipio(id_municipio: number): string {
    const municipio = this.municipios.find(m => m.id_municipio === id_municipio);
    return municipio ? municipio.nombre : `Municipio #${id_municipio}`;
  }
}