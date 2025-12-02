import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { ApiEncuestas, EncuestaConOpciones } from '../../../core/services/encuestas';

@Component({
  selector: 'app-encuesta-actual',
  imports: [ChartModule, ButtonModule],
  templateUrl: './encuesta-actual.html',
  styleUrl: './encuesta-actual.css',
})
export class EncuestaActual {
  encuesta = signal<EncuestaConOpciones | null>(null);
  cargando = signal(true);
  yaVoto = signal(false);

  chartData: any;
  chartOptions: any;

  constructor(private api: ApiEncuestas) {}

  ngOnInit(): void {
    this.load();

    const huella = localStorage.getItem('huella_encuesta');
    if (huella) this.yaVoto.set(true);

    this.configurarOpcionesChart();
  }

  load() {
    this.api.getEncuestaActiva().subscribe({
      next: (enc) => {
        this.encuesta.set(enc);
        this.cargando.set(false);
        this.actualizarChart();
      },
      error: () => this.cargando.set(false),
    });
  }

  votar(idOpcion: number) {
    const huella = this.generarHuella();

    this.api.votar(this.encuesta()!.idEncuesta, idOpcion, huella).subscribe({
      next: () => {
        localStorage.setItem('huella_encuesta', huella);
        this.yaVoto.set(true);
        this.load(); // recargar para actualizar votos
      },
    });
  }

  private generarHuella(): string {
    return 'huella-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // --- CONFIGURACIÓN DEL CHART ---
  actualizarChart() {
    const enc = this.encuesta();
    if (!enc) return;

    this.chartData = {
      labels: enc.opciones.map((o) => o.textoOpcion),
      datasets: [
        {
          data: enc.opciones.map((o) => o.votos),
        },
      ],
    };
  }

  configurarOpcionesChart() {
    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#495057',
          },
        },
      },
    };
  }
}
