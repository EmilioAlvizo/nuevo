import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDirectorios, Directorios } from '../../../core/services/directorios';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directorio.html',
  styleUrls: ['./directorio.css']
})
export class Directorio implements OnInit {
  publicUrl = environment.publicUrl;

  private directoriosService = inject(ApiDirectorios);
  
  directorio?: Directorios;
  directorios: Directorios[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadDirectorios();
  }

  loadDirectorios(): void {
    this.directoriosService.getDirectorios().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo los directorios activos
          // this.directorios = response.data.filter(d => d.estatus === 'A');
          this.directorios = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar directorios:', err);
        this.loading = false;
      }
    });
  }

  abrirDirectorio(directorio: Directorios): void {
    if (directorio.link && directorio.id_directorio) {
      const ruta = `http://localhost:3000/public/directorios/${directorio.id_directorio}/${directorio.link}`;
      window.open(ruta, '_blank');
    } else {
      console.error('Archivo o ID de directorio no definidos');
    }
  }


}