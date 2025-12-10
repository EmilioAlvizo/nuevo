// apoyos-servicios.component.ts
import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiApoyos, Apoyos } from '../../../core/services/apoyos_servicios';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-apoyos-servicios',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './apoyos-servicios.html',
  styleUrls: ['./apoyos-servicios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApoyosServicios implements OnInit {
  private apiApoyos = inject(ApiApoyos);
  publicUrl = environment.publicUrl;

  apoyos = signal<Apoyos[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadApoyos();
  }

  loadApoyos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiApoyos.getApoyos().subscribe({
      next: (response) => {
        if (response.success) {
          this.apoyos.set(response.data.filter(apoyo => apoyo.estatus === 'A'));
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error al cargar apoyos:', err);
        this.error.set('No se pudieron cargar los apoyos y servicios');
        this.loading.set(false);
      }
    });
  }

  getImageUrl(id_apoyo: number, imagen: string): string {
    return `${this.publicUrl}/apoyos_servicios/${id_apoyo}/${imagen}`;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/placeholder-image.png';
  }

  navigateToLink(link: string): void {
    if (link) {
      window.open(link, '_blank');
    }
  }
}