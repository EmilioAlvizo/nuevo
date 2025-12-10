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
  inject,
  input,
  untracked,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';

// Interfaces para tipado estricto
interface Folio {
  front: number | null;
  back: number | null;
  flipped: boolean;
}

@Component({
  selector: 'app-flipbook',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flipbook.html',
  styleUrls: ['./flipbook.css'],
  host: {
    class: 'flipbook-root',
    '[class.fullscreen]': 'isFullscreen()',
    '[attr.tabindex]': '"0"',
    '(window:resize)': 'onResize()',
    '(window:keydown)': 'handleKey($event)',
    '(document:fullscreenchange)': 'onFullscreenChange()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
})
export class Flipbook implements OnDestroy {
  // Inyecciones
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  // Inputs como Signals
  src = input.required<string>();
  basePageWidth = input(800, { alias: 'pageWidth' });

  // Referencias al DOM como Signals
  stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  frontCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('frontCanvas');
  backCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('backCanvas');

  // Estado Reactivo (Signals)
  folios = signal<Folio[]>([]);
  currentFolioIndex = signal(0);
  currentPageNumber = signal(1); // Para vista móvil

  // Estado de UI
  isFullscreen = signal(false);
  isMobileView = signal(false);
  isTurning = signal(false);

  // Dimensiones calculadas
  calculatedPageWidth = signal(800);
  folioHeight = signal(480);

  // PDF Internal State
  private pdfDoc: unknown = null;
  private touchStartX = 0;
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals Computadas (Derived State)
  totalPages = computed(() => {
    // Si hay pdfDoc (no tipado estrictamente por librería externa), usamos numPages, sino el array
    return (this.pdfDoc as any)?.numPages || this.folios().length * 2;
  });

  isMobileFullscreen = computed(() => this.isFullscreen() && this.isMobileView());

  // Computada para texto del contador
  paginationText = computed(() => {
    if (this.isMobileFullscreen()) {
      return `${this.currentPageNumber()} / ${this.totalPages()}`;
    }
    const start = this.currentFolioIndex() * 2 + 1;
    const end = this.currentFolioIndex() * 2 + 2;
    return `${start}-${end} / ${this.totalPages()}`;
  });

  constructor() {
    // Efecto: Cargar PDF cuando cambia el SRC
    effect(() => {
      const url = this.src();
      if (this.isBrowser && url) {
        untracked(() => this.loadPdf(url));
      }
    });

    // Efecto: Recalcular dimensiones iniciales
    effect(() => {
      if (this.isBrowser) {
        this.checkMobileView();
        this.updateDimensions();
      }
    });

    // Efecto: Renderizar cuando cambian índices o tamaño
    effect(() => {
      const idx = this.currentFolioIndex();
      const mobPage = this.currentPageNumber();
      const fs = this.isFullscreen();
      const width = this.calculatedPageWidth(); // Dependencia para re-render al resize

      // Usamos untracked para la función de renderizado para evitar ciclos infinitos si esta actualiza algo menor
      untracked(() => {
        setTimeout(() => this.renderVisibleFolios(), 50);
      });
    });
  }

  ngOnDestroy(): void {
    // Limpieza si fuera necesaria
    if (this.pdfDoc) {
      (this.pdfDoc as any).destroy?.();
    }
  }

  // --- Lógica de Negocio ---

  async loadPdf(url: string) {
    try {
      // Import dinámico para no romper SSR
      const pdfjsLib = await import('pdfjs-dist');
      // Configurar worker (ajusta la ruta según tu build)
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;

      const numPages = (this.pdfDoc as any).numPages;
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
    } catch (err) {
      console.error('Error loading PDF', err);
    }
  }

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
      const maxW = Math.min(this.basePageWidth(), window.innerWidth);
      this.calculatedPageWidth.set(maxW);
      this.folioHeight.set(480);

      // Actualizar variable CSS
      this.updateCssVariable('--page-width', `${maxW}px`);
    }
  }

  private updateCssVariable(name: string, value: string) {
    const root = this.stageRef()?.nativeElement.closest('.flipbook-root') as HTMLElement;
    if (root) {
      root.style.setProperty(name, value);
    }
  }

  async renderVisibleFolios() {
    if (!this.pdfDoc) return;

    const frontEls = this.frontCanvases();
    const backEls = this.backCanvases();
    const promises: Promise<void>[] = [];
    const currentIndex = this.currentFolioIndex();

    // Determinar rango de renderizado
    let startIdx: number, endIdx: number;

    if (this.isMobileFullscreen()) {
      startIdx = Math.max(0, currentIndex - 1);
      endIdx = Math.min(this.folios().length - 1, currentIndex + 1);
    } else {
      startIdx = Math.max(0, currentIndex - 2);
      endIdx = Math.min(this.folios().length - 1, currentIndex + 2);
    }

    for (let i = startIdx; i <= endIdx; i++) {
      const folio = this.folios()[i];

      if (folio.front && frontEls[i]) {
        promises.push(this.renderPageToCanvas(folio.front, frontEls[i].nativeElement));
      }
      if (folio.back && backEls[i]) {
        promises.push(this.renderPageToCanvas(folio.back, backEls[i].nativeElement));
      }
    }

    await Promise.all(promises);
  }

  async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
    // Si el canvas ya tiene contenido y dimensiones correctas, evitar re-render costoso
    // (Opcional: lógica de invalidación si cambia el zoom/tamaño drásticamente)
    if (canvas.width > 0 && !this.isFullscreen()) return;

    try {
      const page = await (this.pdfDoc as any).getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });

      let targetWidth: number;
      if (this.isMobileFullscreen()) {
        targetWidth = this.calculatedPageWidth();
      } else {
        targetWidth = this.calculatedPageWidth() / 2;
      }

      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Canvas fuera de pantalla para doble buffer y nitidez
      const offscreen = document.createElement('canvas');
      offscreen.width = scaledViewport.width;
      offscreen.height = scaledViewport.height;

      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      const visibleCtx = canvas.getContext('2d');
      if (!visibleCtx) return;

      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      visibleCtx.drawImage(offscreen, 0, 0);
    } catch (err) {
      console.error(`Error render page ${pageNumber}`, err);
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
    } else {
      if (this.currentFolioIndex() <= 0) return;

      this.isTurning.set(true);
      this.currentFolioIndex.update((i) => i - 1);

      // Actualizar el estado 'flipped' del folio específico
      this.folios.update((fs) => {
        const newFs = [...fs];
        newFs[this.currentFolioIndex()].flipped = false;
        return newFs;
      });
    }

    setTimeout(() => this.isTurning.set(false), 600);
  }

  next() {
    if (this.isTurning()) return;
    const total = this.totalPages();

    if (this.isMobileFullscreen()) {
      if (this.currentPageNumber() >= total) return;

      this.isTurning.set(true);
      this.currentPageNumber.update((n) => n + 1);
      this.currentFolioIndex.set(Math.floor((this.currentPageNumber() - 1) / 2));
    } else {
      if (this.currentFolioIndex() >= this.folios().length - 1) return;

      this.isTurning.set(true);

      this.folios.update((fs) => {
        const newFs = [...fs];
        newFs[this.currentFolioIndex()].flipped = true;
        return newFs;
      });

      setTimeout(() => {
        this.currentFolioIndex.update((i) => i + 1);
        this.isTurning.set(false);
      }, 600);
      return; // El timeout maneja el flag
    }

    setTimeout(() => this.isTurning.set(false), 300);
  }

  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'Escape' && this.isFullscreen()) this.toggleFullscreen();
  }

  public goToPage(pageNumber: number) {
    if (!this.folios().length) return;

    // Calcular índice del folio (lógica de pares/impares)
    let targetFolioIndex: number;
    if (pageNumber <= 1) {
      targetFolioIndex = 0;
    } else {
      targetFolioIndex = Math.floor((pageNumber - 2) / 2) + 1;
    }

    // Validar rango
    if (targetFolioIndex >= this.folios().length) {
      targetFolioIndex = this.folios().length - 1;
    }

    // Actualizar estados internos usando Signals correctamente
    this.folios.update(currentFolios => {
      // Creamos una copia nueva del array para mantener inmutabilidad
      return currentFolios.map((folio, index) => ({
        ...folio,
        flipped: index < targetFolioIndex // Voltear todos los anteriores
      }));
    });

    this.currentFolioIndex.set(targetFolioIndex);
    
    // Si estamos en móvil, actualizar también el número de página
    if (this.isMobileView()) {
        this.currentPageNumber.set(pageNumber);
    }

    // Forzar renderizado
    this.renderVisibleFolios();
  }

  // --- Touch Events ---

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

  // --- Fullscreen Logic ---

  toggleFullscreen() {
    if (!this.isBrowser) return;
    const root = this.stageRef().nativeElement.closest('.flipbook-root') as HTMLElement;

    if (!this.document.fullscreenElement) {
      root.requestFullscreen().catch((err) => console.error(err));
    } else {
      this.document.exitFullscreen();
    }
  }

  onFullscreenChange() {
    if (!this.isBrowser) return;
    const isFull = !!this.document.fullscreenElement;
    this.isFullscreen.set(isFull);

    if (isFull) {
      if (this.isMobileView()) {
        // Sincronizar página al entrar a fullscreen móvil
        this.currentPageNumber.set(this.currentFolioIndex() * 2 + 1);
      }
      // El effect disparará updateDimensions
    } else {
      this.updateDimensions();
    }
  }

  async calculateFullscreenSize() {
    if (!this.pdfDoc) return;
    try {
      const page = await (this.pdfDoc as any).getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const aspectRatio = viewport.width / viewport.height;

      const availW = window.innerWidth - 40;
      const availH = window.innerHeight - 120;

      if (this.isMobileView()) {
        const wBasedH = availW / aspectRatio;
        if (wBasedH <= availH) {
          this.calculatedPageWidth.set(availW);
          this.folioHeight.set(wBasedH);
        } else {
          this.folioHeight.set(availH);
          this.calculatedPageWidth.set(availH * aspectRatio);
        }
      } else {
        const twoPageAR = aspectRatio * 2;
        const wBasedH = availW / twoPageAR;
        if (wBasedH <= availH) {
          this.calculatedPageWidth.set(availW);
          this.folioHeight.set(wBasedH);
        } else {
          this.folioHeight.set(availH);
          this.calculatedPageWidth.set(availH * twoPageAR);
        }
      }
      this.updateCssVariable('--page-width', `${this.calculatedPageWidth()}px`);
    } catch (e) {
      console.error(e);
    }
  }

  // --- Helpers UI ---

  getZIndex(index: number): number {
    const current = this.currentFolioIndex();
    const isFlipped = this.folios()[index].flipped;

    if (isFlipped && index >= current - 1 && index <= current) return 100;
    if (index < current) return 10 + index;
    if (index === current) return 100;
    return 50 - index;
  }

  isFolioVisible(index: number): boolean {
    if (!this.isMobileFullscreen()) {
      return Math.abs(index - this.currentFolioIndex()) <= 2;
    }
    return index === this.currentFolioIndex();
  }

  // Helpers para vista móvil
  shouldShowFrontInMobile(): boolean {
    return this.currentPageNumber() % 2 === 1;
  }

  shouldShowBackInMobile(): boolean {
    return this.currentPageNumber() % 2 === 0;
  }
}
