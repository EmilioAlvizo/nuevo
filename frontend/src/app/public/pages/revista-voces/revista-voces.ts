import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulosIndependientes, ArticulosIndependientes } from '../../../core/services/articulos';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TabsModule } from 'primeng/tabs';
import { MenuItem } from 'primeng/api';
import { ApiResponsePaginated } from '../../../core/shared/interface';

//BORRAR
// import { Flipbook2 } from '../../components/flipbook2/flipbook2';

@Component({
  selector: 'app-revista-voces',
  standalone: true,
  imports: [CommonModule, TabsModule, RouterModule],
  templateUrl: './revista-voces.html',
  styleUrl: './revista-voces.css',
})
export class RevistaVoces implements OnInit {
  private apiRevistas = inject(ApiRevistas);
  private apiArticulosIndependientes = inject(ApiArticulosIndependientes);
  private router = inject(Router);

  publicUrl = environment.publicUrl;

  revistas = signal<Revistas[]>([]);
  articulosIndependientes = signal<ArticulosIndependientes[]>([]);

  // Breadcrumb
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  breadcrumbItems: MenuItem[] = [{ label: 'Revistas y Artículos' }];

  // Signal para rastrear el tab activo
  activeTab = signal<string>('0');

  // Configuración de los tabs
  private readonly tabTitles: Record<string, string> = {
    '0': 'Revistas',
    '1': 'Artículos Independientes'
  };

  pageTitle = computed(() => this.tabTitles[this.activeTab()] || 'Voces Emergentes');

  constructor() { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // 1. Cargar Revistas
    this.apiRevistas.getRevistas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo las revistas activas
          this.revistas.set(response.data.filter((r) => r.estatus === 'A'));
        }
      },
      error: (error) => console.error('Error al obtener revistas:', error),
    });

    this.apiArticulosIndependientes
      .getFiltrados({ estatus: 'A', limite: 10 })
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.articulosIndependientes.set(response.data);
          }
        },
        error: (err) =>
          console.error('Error al obtener artículos independientes:', err),
      });
  }

  abrirRevista(revista: Revistas): void {
    this.router.navigate(['/revista', revista.id_revista]);
  }
}
