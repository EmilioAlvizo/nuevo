// nuevo/frontend/src/app/public/pages/articulos/articulos.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollProgressBar } from '../../components/scroll-progress-bar/scroll-progress-bar';

@Component({
  selector: 'app-articulos',
  imports: [CommonModule, RouterModule, ScrollProgressBar],
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