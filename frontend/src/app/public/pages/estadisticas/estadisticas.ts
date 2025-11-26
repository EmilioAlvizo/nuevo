// nuevo/frontend/src/app/public/pages/estadisticas/estadisticas.ts
import { Component, inject } from '@angular/core';
import { Tabla } from '../../components/tabla/tabla';
import { NavbarDocumentos } from '../../components/navbar-documentos/navbar-documentos';
import { TablaDinamica } from '../../../shared/tabla-dinamica/tabla-dinamica';
import { ArchMunicipioPublic } from '../../../public/components/arch-municipio-public/arch-municipio-public';

@Component({
  selector: 'app-estadisticas',
  imports: [Tabla, NavbarDocumentos, TablaDinamica],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas {
  protected archivosStrategy = inject(ArchMunicipioPublic);

  mostrarTabla: string = 'archivos_municipio';

  onTipoCambio(idTabla: string) {
    this.mostrarTabla = idTabla;
  }
}
