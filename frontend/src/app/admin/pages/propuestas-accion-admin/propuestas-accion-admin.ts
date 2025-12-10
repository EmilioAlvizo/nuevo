import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs'; // Importamos forkJoin para cargar en paralelo si se desea

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
  imports: [CommonModule, CardModule, ToastModule, ToolbarModule, TooltipModule, AccordionModule],
  providers: [MessageService],
  templateUrl: './propuestas-accion-admin.html',
  styleUrls: ['./propuestas-accion-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // ACTIVADO: Mejor rendimiento
})
export class PropuestasAccionAdmin implements OnInit, OnDestroy {
  // ===========================
  // Inyección de Dependencias
  // ===========================
  private apiPropuesta = inject(ApiPropuesta);
  private apiMunicipio = inject(ApiMunicipio);
  private messageService = inject(MessageService);

  // ===========================
  // Estado (Signals)
  // ===========================
  propuestas = signal<Propuesta[]>([]);
  municipios = signal<Municipio[]>([]);
  loading = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  // ===========================
  // Estado Derivado (Computed) - OPTIMIZACIÓN CLAVE
  // ===========================
  /**
   * Creamos un Map (Diccionario) para buscar municipios por ID instantáneamente.
   * Esto evita usar .find() en el HTML, lo cual es muy lento si hay muchos datos.
   */
  municipiosMap = computed(() => {
    const map = new Map<number, string>();
    this.municipios().forEach((m) => map.set(m.id_municipio, m.nombre));
    return map;
  });

  ngOnInit(): void {
    // Cargamos ambos datos.
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // Carga de Datos
  // ============================================================
  cargarDatos(): void {
    this.loading.set(true);

    // OPCIÓN A: Cargar en paralelo (Más rápido, espera a que ambos terminen)
    forkJoin({
      propuestas: this.apiPropuesta.getPropuestas(),
      municipios: this.apiMunicipio.getMessage(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // 1. Manejar Propuestas
          if (res.propuestas.success && res.propuestas.data) {
            this.propuestas.set(res.propuestas.data);
          } else {
            this.mostrarError('Error al cargar las propuestas.');
          }

          // 2. Manejar Municipios
          if (res.municipios.success && res.municipios.data) {
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

  // ============================================================
  // Helpers para la Vista
  // ============================================================

  /**
   * Obtiene el nombre usando el Map computado (O(1) de complejidad).
   * Super rápido para renderizar en tablas o listas grandes.
   */
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
