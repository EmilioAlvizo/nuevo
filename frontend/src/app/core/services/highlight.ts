import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HighlightService {
  highlightedId = signal<number | null>(null);

  highlight(id: number) {
    this.highlightedId.set(id);

    // quitar resaltado luego de 1s
    setTimeout(() => {
      this.highlightedId.set(null);
    }, 1300);
  }
}
