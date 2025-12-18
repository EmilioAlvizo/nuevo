import { 
  Component, 
  OnInit, 
  ChangeDetectionStrategy, 
  inject, 
  signal, 
  computed 
} from '@angular/core';
import { ApiIntegrantesConsejo, IntegrantesConsejo } from '../../../core/services/consejo';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consejo',
  standalone: true,
  imports: [],
  templateUrl: './consejo.html',
  styleUrl: './consejo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consejo implements OnInit {
  // Inyección de dependencias moderna
  private readonly _apiService = inject(ApiIntegrantesConsejo);
  
  // Constantes
  readonly publicUrl = environment.publicUrl;

  // Estado con Signals
  // Usamos 'private' para el estado interno y exponemos solo lo necesario o computado
  private readonly _integrantesRaw = signal<IntegrantesConsejo[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Estado Derivado (Computed)
  // La lógica de filtrado y ordenamiento se hace reactiva automáticamente
  readonly integrantes = computed(() => {
    const raw = this._integrantesRaw();
    return raw
      .filter((integrante) => integrante.estatus === 'A')
      .sort((a, b) => a.importancia - b.importancia);
  });

  // Computed para verificar si hay datos vacíos (útil para la UI)
  readonly hasNoResults = computed(() => 
    !this.loading() && !this.error() && this.integrantes().length === 0
  );

  ngOnInit(): void {
    this.fetchIntegrantes();
  }

  private fetchIntegrantes(): void {
    this._apiService.getIntegrantes().subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizamos la señal con los datos crudos
          this._integrantesRaw.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error al cargar integrantes:', err);
        this.error.set('Error al cargar los integrantes del consejo');
        this.loading.set(false);
      }
    });
  }
}