// nuevo/frontend/src/app/public/pages/estadisticas/estadisticas.ts
import { Component, inject, signal, computed } from '@angular/core';

import { Tabla } from '../../components/tabla/tabla';
import { TablaDinamica } from '../../../shared/tabla-dinamica/tabla-dinamica';
import { ArchMunicipioPublic } from '../../../public/components/arch-municipio-public/arch-municipio-public';
import { DocCendocPublic } from '../../../public/components/doc-cendoc-public/doc-cendoc-public';

import { MenubarModule } from 'primeng/menubar';
import { TabPanel, TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-estadisticas',
  imports: [TablaDinamica, MenubarModule, TabsModule ],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas {
  protected archivosStrategy = inject(ArchMunicipioPublic);
  protected docStrategy = inject(DocCendocPublic);

  // Signal para rastrear el tab activo
  activeTab = signal<string>('0');

  // Configuración de los tabs con sus títulos
  private readonly tabTitles: Record<string, string> = {
    '0': 'Archivos Municipio',
    '1': 'Centro Documental',
    '2': 'Visualización'
  };

  // Computed signal para obtener el título dinámico
  pageTitle = computed(() => this.tabTitles[this.activeTab()] || 'Estadísticas de las juventudes');

  // Método para actualizar el tab activo
  onTabChange(value: string) {
    this.activeTab.set(value);
  }
  
  // Personalización con Design Tokens de PrimeNG
  menuDesignTokens = {
    item: {
      activeBackground: '#3b82f6',
      color: 'rgb(0, 0, 0)',
      focusColor: '#ffffff',
      focusBackground: '#1677ff',
      activeColor: '#ffffff',
    },
    root: {
      padding: '10px 100px  10px 100px'
    }
  };

  // Personalización con Design Tokens de PrimeNG
  tabDesignTokens = {
    tab: {
      borderWidth: '0 0 2px 0',
      background: '#ecf0f0'
    },
    tabpanel: {
      background: '#ecf0f0'
    },
    tablist: {
      background: '#ecf0f0',
      borderWidth: '0 0 2px 0'

    }
  };
}
