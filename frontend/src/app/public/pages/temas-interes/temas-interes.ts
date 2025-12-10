// temas-interes.ts
import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiTemas, Temas } from '../../../core/services/temas_interes';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-temas-interes',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './temas-interes.html',
  styleUrls: ['./temas-interes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemasInteres implements OnInit {
  private apiTemas = inject(ApiTemas);
  publicUrl = environment.publicUrl;

  temas = signal<Temas[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTemas();
  }

  loadTemas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiTemas.getTemas().subscribe({
      next: (response) => {
        if (response.success) {
          this.temas.set(response.data.filter(tema => tema.estatusTema === 'A'));
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error al cargar temas:', err);
        this.error.set('No se pudieron cargar los temas de interés');
        this.loading.set(false);
      }
    });
  }

  // En el componente TypeScript
  getImageUrl(id_tema: number, imagen: string): string {
    return `${this.publicUrl}/temas_interes/${id_tema}/${imagen}`;
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