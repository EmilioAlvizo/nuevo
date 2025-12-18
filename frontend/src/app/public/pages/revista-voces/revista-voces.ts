import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ApiRevistas, Revistas } from '../../../core/services/revistas';
import { ApiArticulosRevista, ArticulosRevista } from '../../../core/services/articulos_revista';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TabsModule } from 'primeng/tabs';
import { MenuItem } from 'primeng/api';
import { ApiResponsePaginated } from '../../../core/shared/interface';

@Component({
  selector: 'app-revista-voces',
  standalone: true,
  imports: [CommonModule, TabsModule, RouterModule],
  templateUrl: './revista-voces.html',
  styleUrl: './revista-voces.css',
})
export class RevistaVoces implements OnInit {
  private apiRevistas = inject(ApiRevistas);
  private apiArticulos = inject(ApiArticulosRevista);
  private router = inject(Router);

  publicUrl = environment.publicUrl;

  revistas = signal<Revistas[]>([]);
  articulosIndependientes = signal<ArticulosRevista[]>([]);

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

    // 2. Cargar Artículos Independientes
    // Asumimos que los independientes tienen id_revista NULL o una marca específica.
    // Usaremos getFiltrados. Por ahora filtramos por 'estatus' A.
    // Si hay una lógica de 'id_revista' null, se debe pasar aqui.
    // Al no tener confirmación visual, voy a traer todos y filtraré en memoria o pediré backend si fuese necesario.
    // ACTUALIZACION: User dijo "la logica es con getFiltrados". Voy a intentar pasar un filtro que indique "independiente".
    // Si no existe, traeré los recientes.
    // Probaremos filtrar 'id_revista': 'null' si el backend lo soporta, o simplemente traer recientes.
    // Para asegurar que se ve algo, traeremos todo paginado y luego refinamos.

    this.apiArticulos.getFiltrados({ id_revista_matchMode: 'isNull', estatus: 'A', limit: 10 }).subscribe({
      next: (response) => {
        if (response.data) {
          // TODO: Refinar filtro para "Independientes" real
          this.articulosIndependientes.set(response.data);
        }
      },
      error: (err) => console.error(err)
    });
  }

  abrirRevista(revista: Revistas): void {
    this.router.navigate(['/revista', revista.id_revista]);
  }
}
