// nuevo/frontend/src/app/public/components/encuesta-actual/encuesta-actual.ts
import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { ApiEncuestas, EncuestaConOpciones } from '../../../core/services/encuestas';
import { PlatformService } from '../../../core/services/platform.service';

// PrimeNG Modules
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// ChartJS
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-encuesta-actual',
  standalone: true,
  imports: [ChartModule, ButtonModule, SkeletonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './encuesta-actual.html',
  styleUrl: './encuesta-actual.css',
})
export class EncuestaActual implements OnInit {
  private api = inject(ApiEncuestas);
  private platform = inject(PlatformService);
  private messageService = inject(MessageService);

  // Signals
  encuesta = signal<EncuestaConOpciones | null>(null);
  cargando = signal(true);
  yaVoto = signal(false);

  // Bandera para saber si es histórica y bloquear botones
  esHistorial = signal(false);

  // Paleta de colores (Bootstrap friendly + Vibrantes)
  // Se usarán en orden para los botones y el gráfico
  readonly colores = [
    '#0d6efd', // Bootstrap Primary (Azul)
    '#198754', // Bootstrap Success (Verde)
    '#ffc107', // Bootstrap Warning (Amarillo)
    '#dc3545', // Bootstrap Danger (Rojo)
    '#6610f2', // Indigo
    '#0dcaf0', // Cyan
    '#fd7e14', // Orange
  ];

  chartData: any;
  chartOptions: any;

  constructor() {
    effect(() => {
      const enc = this.encuesta();
      if (enc && this.platform.isBrowser) {
        this.construirChart(enc);
        // IMPORTANTE: Verificar si ya votó en ESTA encuesta específica
        this.verificarEstadoVoto(enc.idEncuesta);
      }
    });
  }

  ngOnInit(): void {
    if (this.platform.isBrowser) {
      this.configurarOpcionesChart();
    }
    this.loadEncuesta();
  }

  loadEncuesta() {
    this.cargando.set(true);
    
    // 1. Intentamos cargar la Activa
    this.api.getEncuestaActiva().subscribe({
      next: (enc) => {
        if (enc) {
            this.esHistorial.set(false); // Es LIVE
            this.encuesta.set(enc);
            this.verificarEstadoVoto(enc.idEncuesta);
            this.cargando.set(false);
        } else {
            // 2. Si no devuelve encuesta (null), buscamos la última finalizada
            this.loadUltimaFinalizada();
        }
      },
      error: (err) => {
          // Manejar errores de conexión o servidor
          this.cargando.set(false);
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Problema al cargar la encuesta.'});
      },
    });
  }

  loadUltimaFinalizada() {
    this.api.getUltimaFinalizada().subscribe({
      next: (enc) => {
        this.esHistorial.set(true); // Es HISTORIAL
        this.encuesta.set(enc);
        this.cargando.set(false);
        this.verificarEstadoVoto(enc.idEncuesta); // Aunque esté cerrada, es bueno ver si el usuario votó en su momento
        
        /* this.messageService.add({
          severity: 'info',
          summary: 'Encuesta Finalizada',
          detail: 'Mostrando resultados de la última votación.'
        }); */
      },
      error: (err) => {
        this.cargando.set(false);
        // Podría ser un 404 si no hay ninguna encuesta finalizada en la DB
        if (err.status === 404) {
            this.encuesta.set(null); // No hay nada que mostrar
        } else {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial de encuestas.'});
        }
      }
    });
  }

  votar(idOpcion: number) {
    const enc = this.encuesta();
    
    // BLOQUEO CRÍTICO: No permitir votar si el componente detecta que está en modo historial.
    if (!enc || this.esHistorial()) return; 

    this.cargando.set(true);

    const huella = this.getClientUUID(); 

    this.api.votar(enc.idEncuesta, idOpcion, huella).subscribe({
      next: () => {
        // ... (Mensaje de éxito y reload igual)
        this.marcarVotoLocal(enc.idEncuesta);
        this.yaVoto.set(true);
        this.loadEncuesta(); 
        
        this.messageService.add({
          severity: 'success', 
          summary: '¡Voto registrado!', 
          detail: 'Gracias por participar.'
        });
      },
      error: (err) => {
        this.cargando.set(false);
        
        if (err.status === 409) {
            // ... (Ya votó)
        } 
        // ⚠️ NUEVO MANEJO DE ERROR 403 (Backend dice: Caducó)
        else if (err.status === 403) {
            this.messageService.add({
                severity: 'error',
                summary: 'Votación Cerrada',
                detail: 'La encuesta ha expirado y no se pueden registrar nuevos votos.'
            });
            // Ya que caducó, volvemos a cargar para mostrar el modo historial (aunque lo más probable es que ya esté cargado así)
            this.loadEncuesta(); 
        }
        else {
          // ... (Otros errores)
        }
      },
    });
  }
  /**
   * Genera o recupera un ID único para este navegador.
   * Esto sirve como "Huella" básica.
   */
  private getClientUUID(): string {
    const KEY_UUID = 'app_client_uuid';
    let uuid = localStorage.getItem(KEY_UUID);

    if (!uuid) {
      // Generamos un random string o UUID v4
      uuid = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now() + Math.random();
      localStorage.setItem(KEY_UUID, uuid);
    }
    return uuid;
  }

  /**
   * Verifica si existe la marca de voto para una encuesta específica
   */
  private verificarEstadoVoto(idEncuesta: number) {
    if (!this.platform.isBrowser) {
      return;
    }
    const key = `voto_encuesta_${idEncuesta}`;
    const haVotado = !!localStorage.getItem(key);
    this.yaVoto.set(haVotado);
  }

  /**
   * Guarda la marca de voto para que persista si refresca la página
   */
  private marcarVotoLocal(idEncuesta: number) {
    const key = `voto_encuesta_${idEncuesta}`;
    localStorage.setItem(key, 'true');
  }

  // --- Helpers Visuales ---

  getColor(index: number): string {
    return this.colores[index % this.colores.length];
  }

  private construirChart(enc: EncuestaConOpciones) {
    const bgColors = enc.opciones.map((_, i) => this.getColor(i));

    this.chartData = {
      labels: enc.opciones.map((o) => o.textoOpcion),
      datasets: [
        {
          data: enc.opciones.map((o) => o.votos),
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 10, // Efecto de expansión al pasar mouse
        },
      ],
    };
  }

  private configurarOpcionesChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#333';

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, // Ocultar leyenda dentro del canvas si usas botones con color
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: textColor,
            padding: 20
          }
        },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 12 },
          formatter: (value: number, ctx: Context) => {
            const total = ctx.chart.data.datasets[0].data.reduce(
              (acc: any, val: any) => acc + Number(val),
              0
            );
            if (total === 0) return '';
            const pct = ((value / total) * 100).toFixed(0);
            return Number(pct) > 5 ? pct + '%' : ''; // Solo mostrar si > 5%
          },
        },
      },
    };
  }
}
