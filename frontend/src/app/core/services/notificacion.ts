import { Injectable, signal } from '@angular/core';

export interface Notificacion {
  id: number;
  mensaje: string;
  timestamp: Date;
  leida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  // Lista de notificaciones actuales
  private _notificaciones = signal<Notificacion[]>([]);
  public notificaciones = this._notificaciones.asReadonly();

  private autoId = 1;

  agregar(mensaje: string) {
    const nueva: Notificacion = {
      id: this.autoId++,
      mensaje,
      timestamp: new Date(),
      leida: false
    };

    this._notificaciones.update(list => [nueva, ...list]);
  }

  marcarComoLeida(id: number) {
    this._notificaciones.update(list =>
      list.filter(n => n.id !== id)
    );
  }

  limpiarTodas() {
    this._notificaciones.set([]);
  }
}
