// nuevo/frontend/src/app/admin/pages/estadisticas-admin/estadisticas-admin.ts
import { Component, signal } from '@angular/core';
import { TablaA } from '../../components/tabla-a/tabla-a';
import { TablaArchMunicipios } from '../../components/tabla-arch-municipios/tabla-arch-municipios';
import { TablaDocCendoc } from '../../components/tabla-doc-cendoc/tabla-doc-cendoc';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-estadisticas-admin',
  imports: [TablaA, TablaDocCendoc, TablaArchMunicipios, Menubar],
  templateUrl: './estadisticas-admin.html',
  styleUrl: './estadisticas-admin.css',
})
export class EstadisticasAdmin {
  items: MenuItem[] = [];
  selectedTable = signal<'archMunicipios' | 'a' | 'docCendoc'>('archMunicipios'); // estado reactivo

  ngOnInit() {
    this.items = [
      {
        label: 'Archivos municipio',
        icon: 'pi pi-table',
        command: () => this.selectedTable.set('archMunicipios'),
      },
      {
        label: 'Documentos Cendoc',
        icon: 'pi pi-file',
        command: () => this.selectedTable.set('docCendoc'),
      },
      {
        label: 'Archivos municipio',
        icon: 'pi pi-table',
        command: () => this.selectedTable.set('a'),
      },
    ];
  }
}
