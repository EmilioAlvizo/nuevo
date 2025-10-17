import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revista-voces',
  imports: [ CommonModule],
  templateUrl: './revista-voces.html',
  styleUrl: './revista-voces.css'
})
export class RevistaVoces {
  cards = [
  {
    title: 'Volumen 1',
    articles: 5,
    image: '/revistas/vol1.jpg',
    layers: 5
  },
  {
    title: 'Volumen 2',
    articles: 3,
    image: '/revistas/vol2.jpg',
    layers: 3
  },
    {
    title: 'Volumen 3',
    articles: 4,
    image: '/revistas/vol3.jpg',
    layers: 4
  },
    {
    title: 'Volumen 4',
    articles: 2,
    image: '/revistas/vol4.jpg',
    layers: 2
  },
];

}
