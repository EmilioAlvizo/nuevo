import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  private destroy$ = new Subject<void>();

  constructor(
    private apiPropuesta: ApiPropuesta,
    private apiMunicipio: ApiMunicipio,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarPropuestas();
    this.cargarMunicipios();
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
    this.loading = true;

    this.apiMunicipio.getMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.municipios = res.data;
          } else {
            this.mostrarError('Error al cargar los municipios.');
          }
          this.loading = false;
        },
        error: () => {
          this.mostrarError('No se pudieron cargar los municipios.');
          this.loading = false;
        }
      });
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
