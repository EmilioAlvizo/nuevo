import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HighlightService } from '../../../core/services/highlight';

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
  styleUrls: ['./propuestas-accion-admin.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropuestasAccionAdmin implements OnInit, OnDestroy, AfterViewInit {
 
  // ===========================
  // Estado UI
  // ===========================
  activeIndexes = signal<number[]>([]);

  // ===========================
  // Inyección de dependencias
  // ===========================
  private apiPropuesta = inject(ApiPropuesta);
  private apiMunicipio = inject(ApiMunicipio);
  private messageService = inject(MessageService);
  highlight = inject(HighlightService);

  // ===========================
  // Estado (Signals)
  // ===========================
  propuestas = signal<Propuesta[]>([]);
  municipios = signal<Municipio[]>([]);
  loading = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  // ===========================
  // Estado derivado
  // ===========================
  municipiosMap = computed(() => {
    const map = new Map<number, string>();
    this.municipios().forEach(m => map.set(m.id_municipio, m.nombre));
    return map;
  });

  constructor() {
    /**
     * 🔥 EFECTO CLAVE
     * Escucha el highlight y abre el accordion correcto
     * incluso si los datos se cargan después
     */
    effect(() => {
      const highlightedId = this.highlight.highlightedId();
      const list = this.propuestas();

      if (!highlightedId || list.length === 0) return;

      // Llamar al método que expande y hace scroll
      this.expandirPropuesta(highlightedId);
    });
  }

  // ===========================
  // Ciclo de vida
  // ===========================
  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    const idResaltado = this.highlight.highlightedId();
    if (idResaltado) {
      this.expandirPropuesta(idResaltado);
    }
  }

  // ===========================
  // Carga de datos
  // ===========================
  cargarDatos(): void {
    this.loading.set(true);

    forkJoin({
      propuestas: this.apiPropuesta.getPropuestas(),
      municipios: this.apiMunicipio.getMessage(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.propuestas?.success && res.propuestas.data) {
            this.propuestas.set(res.propuestas.data);
          } else {
            this.mostrarError('Error al cargar las propuestas.');
          }

          if (res.municipios?.success && res.municipios.data) {
            this.municipios.set(res.municipios.data);
          } else {
            this.mostrarError('Error al cargar los municipios.');
          }

          this.loading.set(false);
        },
        error: () => {
          this.mostrarError('No se pudieron cargar los datos.');
          this.loading.set(false);
        },
      });
  }

  // ===========================
  // 🎯 Expandir y hacer scroll
  // ===========================
  private expandirPropuesta(idPropuesta: number) {
    const index = this.propuestas().findIndex(
      p => p.id_propuesta === idPropuesta
    );
    
    if (index !== -1) {
      // Expandir el panel
      this.activeIndexes.set([index]);
      
      // ✨ Scroll automático con múltiples estrategias
      const intentarScroll = (intentos = 0) => {
        // Estrategia 1: Buscar por data-propuesta-id
        let elemento = document.querySelector(`[data-propuesta-id="${idPropuesta}"]`);
        
        // Estrategia 2: Buscar por la clase highlight-panel
        if (!elemento) {
          elemento = document.querySelector('.highlight-panel');
        }
        
        // Estrategia 3: Buscar el panel por índice
        if (!elemento) {
          const panels = document.querySelectorAll('p-accordion-panel');
          elemento = panels[index];
        }
        
        if (elemento) {
          // Método 1: scrollIntoView
          try {
            elemento.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          } catch (e) {
            // Silenciar error
          }
          
          // Método 2: Scroll manual como backup
          setTimeout(() => {
            try {
              const rect = elemento!.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const targetPosition = rect.top + scrollTop - 100;
              
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            } catch (e) {
              // Silenciar error
            }
          }, 100);
          
          // Agregar clase de rebote
          elemento.classList.add('scroll-bounce');
          setTimeout(() => {
            elemento!.classList.remove('scroll-bounce');
          }, 600);
          
          return true;
        } else if (intentos < 8) {
          // Reintentar después de 250ms
          setTimeout(() => intentarScroll(intentos + 1), 250);
          return false;
        } else {
          // Fallback final: scroll al inicio del accordion
          const accordion = document.querySelector('.p-accordion');
          if (accordion) {
            accordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return false;
        }
      };
      
      // Iniciar scroll después de un delay
      setTimeout(() => intentarScroll(), 500);
    }
  }

  // ===========================
  // Helpers
  // ===========================
  getNombreMunicipio(id_municipio: number): string {
    return this.municipiosMap().get(id_municipio) || `Municipio #${id_municipio}`;
  }

  mostrarError(mensaje: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje,
      life: 3500,
    });
  }

}