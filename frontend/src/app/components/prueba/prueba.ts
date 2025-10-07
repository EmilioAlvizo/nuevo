import { Component, OnInit } from '@angular/core';
import { Api } from '../../api'

@Component({
  selector: 'app-prueba',
  imports: [],
  templateUrl: './prueba.html',
  styleUrl: './prueba.css'
})

export class Prueba implements OnInit{
  message: string | undefined;
  constructor(private apiService: Api) {}
  ngOnInit() {
    this.apiService.getMessage().subscribe(
      (data: any) => {
        console.log(data);
        this.message = data;
      },
      (error: any) => {
        console.error('An error occurred:', error);
      }
    );
  }
}
