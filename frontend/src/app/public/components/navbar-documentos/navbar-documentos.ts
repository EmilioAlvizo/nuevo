import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TipoDocumento {
  id: string;     // identificador único
  label: string;  // texto del botón
}

@Component({
  selector: 'app-navbar-documentos',
  imports: [CommonModule],
  templateUrl: './navbar-documentos.html',
  styleUrl: './navbar-documentos.css'
})
export class NavbarDocumentos {
  @Output() tipoCambio = new EventEmitter<string>();

  opciones: TipoDocumento[] = [
    { id: 'archivos_municipio', label: 'Archivos Municipio' },
    { id: 'documentos_cendoc', label: 'Documentos Cendoc' },
    // Puedes añadir más tablas aquí:
    // { id: 'otra_tabla', label: 'Otro Documento' }
  ];

  activo: string = this.opciones[0].id;

  cambiarTipo(opcion: TipoDocumento) {
    this.activo = opcion.id;
    this.tipoCambio.emit(opcion.id);
  }
}
