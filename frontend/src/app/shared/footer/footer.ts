import { Component, ChangeDetectorRef, signal, effect, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InterfazService } from '../../core/services/interfaz';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class Footer implements OnInit {
  publicUrl = environment.publicUrl;

  // Signals para logo
  logoUrl = signal<string>(`${environment.publicUrl}/assets/logo_1.png`);
  logoLoaded = signal<boolean>(false);

  constructor(private interfazService: InterfazService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLogo();
  }

  private loadLogo(): void {
    this.interfazService.getLogoIzquierda().subscribe({
      next: (url) => {
        this.logoUrl.set(url);
        this.logoLoaded.set(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.logoUrl.set(`${environment.publicUrl}/assets/logo_1.png`);
        this.logoLoaded.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  onImageError(): void {
    this.logoUrl.set(`${environment.publicUrl}/assets/logo_1.png`);
    this.cdr.markForCheck();
  }
}
