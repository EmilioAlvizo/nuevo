// temas-interes.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiTemas, Temas } from '../../../core/services/temas_interes';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-temas-interes',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './temas-interes.html',
  styleUrls: ['./temas-interes.css']
})
export class TemasInteres implements OnInit {
  publicUrl = environment.publicUrl;
  temas: Temas[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private apiTemas: ApiTemas) {}

  ngOnInit(): void {
    this.loadTemas();
  }

  loadTemas(): void {
    this.loading = true;
    this.error = null;

    this.apiTemas.getTemas().subscribe({
      next: (response) => {
        if (response.success) {
          this.temas = response.data.filter(tema => tema.estatusTema === 'A');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar temas:', err);
        this.error = 'No se pudieron cargar los temas de interés';
        this.loading = false;
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