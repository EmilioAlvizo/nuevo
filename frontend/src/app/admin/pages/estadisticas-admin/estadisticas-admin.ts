// nuevo/frontend/src/app/admin/pages/estadisticas-admin/estadisticas-admin.ts
import { Component, signal } from '@angular/core';
import { TablaA } from '../../components/tabla-a/tabla-a';
import { TablaDocCendoc } from '../../components/tabla-doc-cendoc/tabla-doc-cendoc';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-estadisticas-admin',
  imports: [TablaA, TablaDocCendoc, Menubar],
  templateUrl: './estadisticas-admin.html',
  styleUrl: './estadisticas-admin.css',
})
export class EstadisticasAdmin {
  items: MenuItem[] = [];
  selectedTable = signal<'a' | 'docCendoc'>('a'); // estado reactivo

  ngOnInit() {
    this.items = [
      {
        label: 'Archivos municipio',
        icon: 'pi pi-table',
        command: () => this.selectedTable.set('a'),
      },
      {
        label: 'Documentos Cendoc',
        icon: 'pi pi-file',
        command: () => this.selectedTable.set('docCendoc'),
      },
    ];
  }
}
