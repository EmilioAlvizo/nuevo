// nuevo/frontend/src/app/public/pages/articulos/articulos.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-articulos',
  imports: [CommonModule, RouterModule],
  templateUrl: './articulos.html',
  styleUrl: './articulos.css',
})
export class Articulos {
  idRevista!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.idRevista = Number(this.route.snapshot.paramMap.get('id'));
  }
}