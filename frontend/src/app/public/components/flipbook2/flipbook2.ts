import {
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  viewChild,
  viewChildren,
  input,
  untracked,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';

interface Folio {
  front: number | null;
  back: number | null;
  flipped: boolean;
}

@Component({
  selector: 'app-flipbook2',
  imports: [CommonModule],
  templateUrl: './flipbook2.html',
  styleUrl: './flipbook2.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flipbook-root',
    '[class.fullscreen]': 'isFullscreen()',
    '[attr.tabindex]': '"0"',
    '(window:resize)': 'onResize()',
    '(window:keydown)': 'handleKey($event)',
    '(document:fullscreenchange)': 'onFullscreenChange()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
    '[style.--page-width]': 'cssPageWidth()',
  },
})
export class Flipbook2 implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  // --- Inputs ---
  src = input.required<string>();
  basePageWidth = input(800, { alias: 'pageWidth' });

  // --- Element Refs ---
  stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  frontCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('frontCanvas');
  backCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('backCanvas');

  // --- Signals de Estado ---
  folios = signal<Folio[]>([]);
  currentFolioIndex = signal(0);
  currentPageNumber = signal(1); // Importante para vista móvil

  isFullscreen = signal(false);
  isMobileView = signal(false);
  isTurning = signal(false);

  // Dimensiones
  calculatedPageWidth = signal(800);
  folioHeight = signal(480);
  cssPageWidth = computed(() => `${this.calculatedPageWidth()}px`);
  // Nuevo signal para almacenar el aspect ratio del PDF
  pdfAspectRatio = signal<number | null>(null);

  // --- Estado Interno (No reactivo) ---
  private pdfDoc: any = null;
  private touchStartX = 0;
  private isBrowser = isPlatformBrowser(this.platformId);
  private isRendering = false;
  private renderQueue: (() => void) | null = null;

  // --- Computed Helpers ---
  totalPages = computed(() => (this.pdfDoc ? this.pdfDoc.numPages : this.folios().length * 2));

  isMobileFullscreen = computed(() => this.isFullscreen() && this.isMobileView());

  paginationText = computed(() => {
    const total = this.totalPages();
    if (this.isMobileFullscreen()) {
      return `${this.currentPageNumber()} / ${total}`;
    }
    const start = this.currentFolioIndex() * 2 + 1;
    const end = this.currentFolioIndex() * 2 + 2;
    const displayEnd = end > total ? total : end;
    return `${start}-${displayEnd} / ${total}`;
  });

  constructor() {
    // 1. Cargar PDF
    effect(() => {
      const url = this.src();
      if (this.isBrowser && url) {
        untracked(() => this.loadPdf(url));
      }
    });

    // 2. Manejar Resize/Dimensiones
    effect(() => {
      if (!this.isBrowser) return;
      // Dependencias que disparan el recálculo
      const fs = this.isFullscreen();
      const w = this.basePageWidth();

      untracked(() => {
        this.checkMobileView();
        this.updateDimensions();
      });
    });

    // 3. Renderizado Reactivo
    effect(() => {
      // Suscripción a cambios
      const _folios = this.folios();
      const _idx = this.currentFolioIndex();
      const _mob = this.currentPageNumber();
      const _fs = this.isFullscreen();
      const _fronts = this.frontCanvases(); // Necesario para saber cuando el DOM está listo

      untracked(() => {
        if (this.folios().length > 0 && this.frontCanvases().length > 0) {
          // Pequeño delay para asegurar que el DOM layout esté listo
          setTimeout(() => this.scheduleRender(), 50);
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.pdfDoc && (this.pdfDoc as any).destroy) {
      (this.pdfDoc as any).destroy();
    }
  }

  // --- Lógica Principal (Restaurada del Original) ---

  async loadPdf(url: string) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;

      // 1. OBTENER Y GUARDAR ASPECT RATIO
      const page = await this.pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      this.pdfAspectRatio.set(viewport.width / viewport.height);

      const numPages = this.pdfDoc.numPages;
      const newFolios: Folio[] = [];

      for (let p = 1; p <= numPages; p += 2) {
        newFolios.push({
          front: p,
          back: p + 1 <= numPages ? p + 1 : null,
          flipped: false,
        });
      }

      this.folios.set(newFolios);
      this.currentFolioIndex.set(0);
      this.currentPageNumber.set(1);

      // 2. FORZAR RECALCULO DE DIMENSIONES DESPUÉS DE OBTENER EL ASPECT RATIO
      this.updateDimensions();
    } catch (err) {
      console.error('Error loading PDF', err);
    }
  }

  // --- Renderizado Optimizado (Igual al Original) ---

  scheduleRender() {
    if (this.isRendering) {
      this.renderQueue = () => this.renderVisibleFolios();
      return;
    }
    this.renderVisibleFolios();
  }

  async renderVisibleFolios() {
    if (!this.pdfDoc || this.isRendering) return;
    this.isRendering = true;

    const frontEls = this.frontCanvases();
    const backEls = this.backCanvases();
    const promises: Promise<void>[] = [];
    const currentIndex = this.currentFolioIndex();

    if (this.isMobileFullscreen()) {
      // 📱 MÓVIL (Lógica original): Actual +/- 1 con optimización
      const startIdx = Math.max(0, currentIndex - 1);
      const endIdx = Math.min(this.folios().length - 1, currentIndex + 1);

      for (let i = startIdx; i <= endIdx; i++) {
        const folio = this.folios()[i];

        // Lógica original: Renderizar si no ha sido renderizado (width=0) o si es el folio actual
        if (folio.front && frontEls[i]) {
          const canvas = frontEls[i].nativeElement;
          if (canvas.width === 0 || i === currentIndex) {
            promises.push(this.renderPageToCanvas(folio.front, canvas));
          }
        }

        if (folio.back && backEls[i]) {
          const canvas = backEls[i].nativeElement;
          if (canvas.width === 0 || i === currentIndex) {
            promises.push(this.renderPageToCanvas(folio.back, canvas));
          }
        }
      }
    } else {
      // 💻 ESCRITORIO (Lógica original): Folios visibles (index +/- 2)
      // **CORREGIDO**: Se ha eliminado el check `canvas.width === 0` para forzar el renderizado en carga/redimensionamiento,
      // tal como hacía tu código imperativo original. Esto soluciona la página blanca inicial.
      const startIdx = Math.max(0, currentIndex - 2);
      const endIdx = Math.min(this.folios().length - 1, currentIndex + 2);

      for (let i = startIdx; i <= endIdx; i++) {
        const folio = this.folios()[i];

        if (folio.front && frontEls[i]) {
          promises.push(this.renderPageToCanvas(folio.front, frontEls[i].nativeElement));
        }
        if (folio.back && backEls[i]) {
          promises.push(this.renderPageToCanvas(folio.back, backEls[i].nativeElement));
        }
      }
    }

    await Promise.all(promises);
    this.isRendering = false;

    if (this.renderQueue) {
      const next = this.renderQueue;
      this.renderQueue = null;
      next();
    }
  }

  async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });

      // 1. Determinar el ancho objetivo en pantalla
      let targetWidth: number;
      if (this.isMobileFullscreen()) {
        targetWidth = this.calculatedPageWidth();
      } else {
        targetWidth = this.calculatedPageWidth() / 2;
      }

      // 2. Configurar calidad alta (Device Pixel Ratio)
      const dpr = window.devicePixelRatio || 1;

      // 3. EL TRUCO DEL ESCALADO (Bleed):
      // Multiplicamos por 1.005 (0.5% extra) para que la imagen sea
      // imperceptiblemente más grande que el hueco, forzando a cerrar las líneas.
      const bleedScale = 1.005;

      const baseScale = targetWidth / viewport.width;
      const outputScale = baseScale * dpr * bleedScale; // <--- APLICAR BLEED

      const scaledViewport = page.getViewport({ scale: outputScale });

      // 4. Canvas Offscreen con dimensiones enteras
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.floor(scaledViewport.width);
      offscreen.height = Math.floor(scaledViewport.height);

      const ctx = offscreen.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Desactivar suavizado puede ayudar en algunos casos, pero 'high' es mejor para revistas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 5. EL TRUCO DEL FONDO (Contrast Background):
      // Rellenar de negro/gris oscuro antes de renderizar.
      // Si queda una línea de 1px, será oscura y se mezclará con la imagen.
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Renderizar PDF
      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;

      // 6. Pasar al Canvas Visible
      const visibleCtx = canvas.getContext('2d', { alpha: false });
      if (!visibleCtx) return;

      // Asignar tamaño real (físico)
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;

      // Limpiar y dibujar
      visibleCtx.fillStyle = '#1a1a1a'; // Fondo oscuro también aquí por seguridad
      visibleCtx.fillRect(0, 0, canvas.width, canvas.height);

      visibleCtx.drawImage(offscreen, 0, 0);
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}`, err);
    }
  }
  // --- Navegación ---

  prev() {
    if (this.isTurning()) return;

    if (this.isMobileFullscreen()) {
      if (this.currentPageNumber() <= 1) return;
      this.isTurning.set(true);
      this.currentPageNumber.update((n) => n - 1);
      this.currentFolioIndex.set(Math.floor((this.currentPageNumber() - 1) / 2));
      setTimeout(() => this.isTurning.set(false), 300);
    } else {
      if (this.currentFolioIndex() <= 0) return;
      this.isTurning.set(true);
      this.currentFolioIndex.update((i) => i - 1);

      // Actualizar estado flipped
      this.folios.update((fs) => {
        const copy = [...fs];
        copy[this.currentFolioIndex()].flipped = false;
        return copy;
      });

      setTimeout(() => this.isTurning.set(false), 600);
    }
  }

  next() {
    if (this.isTurning()) return;
    const total = this.totalPages();

    if (this.isMobileFullscreen()) {
      if (this.currentPageNumber() >= total) return;
      this.isTurning.set(true);
      this.currentPageNumber.update((n) => n + 1);
      this.currentFolioIndex.set(Math.floor((this.currentPageNumber() - 1) / 2));
      setTimeout(() => this.isTurning.set(false), 300);
    } else {
      if (this.currentFolioIndex() >= this.folios().length) return;
      this.isTurning.set(true);

      // 1. Flip visual
      this.folios.update((fs) => {
        const copy = [...fs];
        copy[this.currentFolioIndex()].flipped = true;
        return copy;
      });

      // 2. Cambio de índice lógico después de la animación
      setTimeout(() => {
        this.currentFolioIndex.update((i) => i + 1);
        this.isTurning.set(false);
      }, 600);
    }
  }

  // --- Lógica importada de RevistaDetalle Original ---
  public goToPage(pageNumber: number) {
    if (this.folios().length === 0) return;

    // Lógica Original para calcular el folioIndex
    let targetIndex: number;

    if (pageNumber <= 1) {
      targetIndex = 0;
    } else {
      targetIndex = Math.floor((pageNumber - 2) / 2) + 1;
    }

    if (targetIndex >= this.folios().length) targetIndex = this.folios().length - 1;
    if (targetIndex < 0) targetIndex = 0;

    // Aplicar estado 'flipped' a todos los anteriores (lógica original manual)
    this.folios.update((fs) =>
      fs.map((f, i) => ({
        ...f,
        flipped: i < targetIndex, // True si el índice es menor al target
      }))
    );

    this.currentFolioIndex.set(targetIndex);

    // Si estamos en móvil, actualizar también el número de página
    if (this.isMobileView()) {
      this.currentPageNumber.set(pageNumber);
    }

    // Forzar render inmediato
    setTimeout(() => this.scheduleRender(), 50);
  }

  // --- Helpers y Eventos ---

  onResize() {
    this.checkMobileView();
    this.updateDimensions();
  }

  checkMobileView() {
    if (!this.isBrowser) return;
    this.isMobileView.set(window.innerWidth < 768);
  }

  updateDimensions() {
    if (!this.isBrowser) return;

    if (this.isFullscreen()) {
      this.calculateFullscreenSize();
    } else {
      // 💻 MODO NORMAL/ESCRITORIO
      const maxW = Math.min(this.basePageWidth(), window.innerWidth);
      this.calculatedPageWidth.set(maxW);

      const ar = this.pdfAspectRatio();

      if (ar !== null) {
        // CORRECCIÓN: Calcular la altura basada en el ancho de UNA página y el Aspect Ratio
        const pageW = maxW / 2;
        this.folioHeight.set(pageW / ar); // Alto = Ancho / AR
      } else {
        // Fallback si el PDF aún no carga
        this.folioHeight.set(480);
      }
    }
  }

  toggleFullscreen() {
    if (!this.isBrowser) return;
    const root = this.stageRef().nativeElement.closest('.flipbook-root');

    if (!this.document.fullscreenElement) {
      root?.requestFullscreen().catch(console.error);
    } else {
      this.document.exitFullscreen();
    }
  }

  onFullscreenChange() {
    if (!this.isBrowser) return;
    const isFull = !!this.document.fullscreenElement;
    this.isFullscreen.set(isFull);

    if (isFull) {
      this.calculateFullscreenSize();
      // Sincronizar página móvil al entrar (Lógica Original)
      if (this.isMobileView()) {
        this.currentPageNumber.set(this.currentFolioIndex() * 2 + 1);
      }
    } else {
      this.updateDimensions(); // Resetear a tamaño normal
    }
  }

  async calculateFullscreenSize() {
    if (!this.pdfDoc) return;
    try {
      const page = await this.pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const ar = viewport.width / viewport.height;

      const availW = window.innerWidth - 40;
      const availH = window.innerHeight - 120; // Margen para controles

      if (this.isMobileView()) {
        const wBasedH = availW / ar;
        if (wBasedH <= availH) {
          this.calculatedPageWidth.set(availW);
          this.folioHeight.set(wBasedH);
        } else {
          this.folioHeight.set(availH);
          this.calculatedPageWidth.set(availH * ar);
        }
      } else {
        const twoPageAR = ar * 2;
        const wBasedH = availW / twoPageAR;
        if (wBasedH <= availH) {
          this.calculatedPageWidth.set(availW);
          this.folioHeight.set(wBasedH);
        } else {
          this.folioHeight.set(availH);
          this.calculatedPageWidth.set(availH * twoPageAR);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'Escape' && this.isFullscreen()) this.toggleFullscreen();
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    const endX = event.changedTouches[0].screenX;
    const diff = this.touchStartX - endX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) this.next();
      else this.prev();
    }
  }

  // --- UI Helpers ---

  getZIndex(index: number): number {
    const cur = this.currentFolioIndex();
    const isFlipped = this.folios()[index].flipped;

    if (isFlipped && index >= cur - 1 && index <= cur) return 100;
    if (index < cur) return 10 + index;
    if (index === cur) return 100;
    return 50 - index;
  }

  // Helper para determinar si un folio debe estar visible
  isFolioVisible(index: number): boolean {
    if (!this.isMobileFullscreen()) {
      // Modo escritorio: mostrar folios cercanos (índice +/- 2)
      return Math.abs(index - this.currentFolioIndex()) <= 2;
    }
    // Modo móvil: solo el folio actual
    return index === this.currentFolioIndex();
  }

  shouldShowFrontInMobile(): boolean {
    return this.currentPageNumber() % 2 === 1;
  }

  shouldShowBackInMobile(): boolean {
    return this.currentPageNumber() % 2 === 0;
  }

}
