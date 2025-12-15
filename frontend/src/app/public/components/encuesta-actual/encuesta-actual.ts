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
    this.api.getEncuestaActiva().subscribe({
      next: (enc) => {
        this.encuesta.set(enc);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  votar(idOpcion: number) {
    const enc = this.encuesta();
    if (!enc) return;

    this.cargando.set(true);

    // 1. Obtenemos una huella única del navegador
    const huella = this.getClientUUID(); // Asumiendo que ya implementaste getClientUUID

    this.api.votar(enc.idEncuesta, idOpcion, huella).subscribe({
      next: () => {
        // Marcamos localmente, actualizamos estado y recargamos
        this.marcarVotoLocal(enc.idEncuesta);
        this.yaVoto.set(true);
        this.loadEncuesta();

        // Mensaje de éxito (Opcional, pero bueno)
        this.messageService.add({
          severity: 'success',
          summary: '¡Voto registrado!',
          detail: 'Gracias por participar. Los resultados se han actualizado.'
        });
      },
      error: (err) => {
        this.cargando.set(false);

        // Manejo de Error 409 (Conflicto: Ya votaste)
        if (err.status === 409) {
          this.marcarVotoLocal(enc.idEncuesta); // Bloqueamos la UI localmente también
          this.yaVoto.set(true);
          this.messageService.add({
            severity: 'warn',
            summary: 'Voto no aceptado',
            detail: 'Ya has votado en esta encuesta. No se permite votar más de una vez.',
          });
          // Si el voto fue rechazado, volvemos a cargar para ver los resultados
          this.loadEncuesta();

        } else {
          // Otros errores (servidor caído, etc.)
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al intentar registrar tu voto. Intenta de nuevo.',
          });
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
