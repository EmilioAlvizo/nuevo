// nuevo/frontend/src/app/public/pages/articulos/articulos.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-articulos',
  imports: [CommonModule, RouterModule],
  templateUrl: './articulos.html',
  styleUrl: './articulos.css',
})
export class Articulos {
  idRevista!: number;
  idArticulo!: number;

  html!: SafeHtml;
  cargando = true;
  cssUrl!: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.idRevista = Number(this.route.snapshot.paramMap.get('id'));
    this.idArticulo = Number(this.route.snapshot.paramMap.get('idArticulo'));

    this.cargarArticulo();
  }

  cargarArticulo() {
    const base = `revistas/${this.idRevista}/articulos/${this.idArticulo}/articulo-${this.idArticulo}`;
    const htmlPath = `${base}.html`;
    const cssPath = `${base}.css`;

    // Permitir CSS externo
    this.cssUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cssPath);

    this.http.get(htmlPath, { responseType: 'text' }).subscribe({
      next: (contenido) => {
        // EVITAR que Angular lo sanitice
        this.html = this.sanitizer.bypassSecurityTrustHtml(contenido);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando artículo:', err);
        this.cargando = false;
      },
    });
  }
}
