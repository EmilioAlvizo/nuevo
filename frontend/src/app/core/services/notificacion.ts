import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Notificacion {
  id: number;
  mensaje: string;
  timestamp: Date;
  leida: boolean;
  link?: string; // URL para navegar al detalle
  tipo?: 'propuesta' | 'documento' | 'general'; // Tipo de notificación
  idReferencia?: number; // ID del elemento relacionado
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly STORAGE_KEY = 'admin_notificaciones';
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  // Lista de notificaciones actuales
  private _notificaciones = signal<Notificacion[]>([]);
  public notificaciones = this._notificaciones.asReadonly();

  private autoId = 1;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.cargarNotificaciones();
    }
  }

  /**
   * Carga las notificaciones desde localStorage
   */
  private cargarNotificaciones() {
    if (!this.isBrowser) return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir timestamps de string a Date
        const notifs = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this._notificaciones.set(notifs);
        
        // Actualizar autoId al máximo ID existente + 1
        if (notifs.length > 0) {
          this.autoId = Math.max(...notifs.map((n: Notificacion) => n.id)) + 1;
        }
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }

  /**
   * Guarda las notificaciones en localStorage
   */
  private guardarNotificaciones() {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._notificaciones()));
    } catch (error) {
      console.error('Error al guardar notificaciones:', error);
    }
  }

  /**
   * Agrega una nueva notificación
   */
  agregar(
    mensaje: string, 
    opciones?: {
      link?: string;
      tipo?: 'propuesta' | 'documento' | 'general';
      idReferencia?: number;
    }
  ) 
  {
    const nueva: Notificacion = {
      id: this.autoId++,
      mensaje,
      timestamp: new Date(),
      leida: false,
      link: opciones?.link,
      tipo: opciones?.tipo || 'general',
      idReferencia: opciones?.idReferencia
    };

    this._notificaciones.update(list => [nueva, ...list]);
    this.guardarNotificaciones();
    //console.log("Nueva notificación:", nueva);
  } 

  /**
   * Marca una notificación como leída y la elimina
   */
  marcarComoLeida(id: number) {
    this._notificaciones.update(list =>
      list.filter(n => n.id !== id)
    );
    this.guardarNotificaciones();
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas() {
    this._notificaciones.set([]);
    this.guardarNotificaciones();
  }

  /**
   * Limpia todas las notificaciones
   */
  limpiarTodas() {
    this._notificaciones.set([]);
    this.guardarNotificaciones();
  }

  /**
   * Obtiene el número de notificaciones no leídas
   */
  get contadorNoLeidas(): number {
    return this._notificaciones().filter(n => !n.leida).length;
  }
}