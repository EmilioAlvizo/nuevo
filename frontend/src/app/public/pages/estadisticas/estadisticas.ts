// nuevo/frontend/src/app/public/pages/estadisticas/estadisticas.ts
import { Component } from '@angular/core';
import { Tabla } from '../../components/tabla/tabla';
import { NavbarDocumentos } from '../../components/navbar-documentos/navbar-documentos';

@Component({
  selector: 'app-estadisticas',
  imports: [Tabla, NavbarDocumentos],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas {
  mostrarTabla: string = 'archivos_municipio';

  onTipoCambio(idTabla: string) {
    this.mostrarTabla = idTabla;
  }
}
