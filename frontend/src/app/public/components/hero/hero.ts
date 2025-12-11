import { Component, OnInit, inject, signal, computed } from '@angular/core'; // Agrega computed
import { RouterModule } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, NgOptimizedImage, RouterModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  private srvRevistas = inject(ApiRevistas);

  // Señal para las revistas
  revistas = signal<Revistas[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.getRevistasRecientes();
  }

  getRevistasRecientes() {
    this.loading.set(true);
    this.srvRevistas
      .getFiltrados({
        estatus: ['A'],
        limite: 5, // IMPORTANTE: Traemos 5 para llenar el grid visual
        pagina: 1,
        sortField: 'fecha',
        sortOrder: -1,
      })
      .subscribe({
        next: (res) => {
          // Asumiendo que 'res' es el array de revistas o res.data
          // Ajusta según tu estructura de respuesta real
          this.revistas.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  // Helper para obtener la URL de la imagen (ajusta según tu lógica actual)
  getPortadaUrl(rev: Revistas): string {
    return `/revistas/${rev.id_revista}/portada/${rev.portada}`;
  }
}
