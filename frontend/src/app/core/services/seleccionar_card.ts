import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class SeleccionarCard {
  // Señal para almacenar la card seleccionada
  selectedCard = signal<string>(''); 

  // Método para actualizar la card seleccionada
  setSelectedCard(value: string) {
    this.selectedCard.set(value);

    setTimeout(() => {
      this.selectedCard.set('');
    }, 1000);
  }
}
