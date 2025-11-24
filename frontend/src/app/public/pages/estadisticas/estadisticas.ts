// nuevo/frontend/src/app/public/pages/estadisticas/estadisticas.ts
import { Component, signal } from '@angular/core';

import { Tabla } from '../../components/tabla/tabla';
import { NavbarDocumentos } from '../../components/navbar-documentos/navbar-documentos';
import { TablaArchMunicipios } from '../../../public/components/tabla-arch-municipios/tabla-arch-municipios';


import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-estadisticas',
  imports: [Tabla, NavbarDocumentos, Menubar, TablaArchMunicipios],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas {
  mostrarTabla: string = 'archivos_municipio';

  onTipoCambio(idTabla: string) {
    this.mostrarTabla = idTabla;
  }

  items: MenuItem[] = [];
  selectedTable = signal<'archMunicipios' | 'docCendoc'>('archMunicipios'); // estado reactivo

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
    ];
  }
}
