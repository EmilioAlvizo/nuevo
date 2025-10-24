import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ApiRevistas, Revistas } from '../../../services/revistas';
import { Flipbook } from '../../components/flipbook/flipbook';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);


@Component({
  selector: 'app-revista-detalle',
  standalone: true,
  imports: [CommonModule, Flipbook],
  templateUrl: './revista-detalle.html',
  styleUrls: ['./revista-detalle.css'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }] 
})
export class RevistaDetalle implements OnInit {

  revista?: Revistas;

  constructor(
    private route: ActivatedRoute,
    private apiRevistas: ApiRevistas
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.obtenerRevista(+id);
  }

  obtenerRevista(id: number): void {
    this.apiRevistas.getRevistas().subscribe({
      next: (response) => {
        const encontrada = response.data.find(r => r.id_revista === id);
        if (encontrada) this.revista = encontrada;
      },
      error: (err) => console.error('Error al obtener detalle:', err)
    });
  }

  descargarPDF(): void {
  if (this.revista?.archivo && this.revista?.id_revista) {
    const ruta = `/revistas_archivos/${this.revista.id_revista}/${this.revista.archivo}`;
    window.open(ruta, '_blank');
  } else {
    console.error('Archivo o ID de revista no definidos');
  }
}


}
