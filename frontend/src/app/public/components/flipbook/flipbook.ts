// nuevo/frontend/src/app/public/components/flipbook/flipbook.ts
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
    '[style.--page-width]': 'cssPageWidth()',
  },
})
export class Flipbook implements OnDestroy {
  // --- Inyecciones ---
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  // --- Inputs (Signals) ---
  src = input.required<string>();
  basePageWidth = input(800, { alias: 'pageWidth' });

  // --- View Queries (Signals) ---
  stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  // Estas señales se actualizan cuando el DOM cambia (@for)
  frontCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('frontCanvas');
  backCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('backCanvas');

  // --- Estado (Signals) ---
  folios = signal<Folio[]>([]);
  currentFolioIndex = signal(0);
  currentPageNumber = signal(1); // Para vista móvil

  isFullscreen = signal(false);
  isMobileView = signal(false);
  isTurning = signal(false);

  // Dimensiones calculadas
  calculatedPageWidth = signal(800);
  folioHeight = signal(480);

  // Helper para variable CSS
  cssPageWidth = computed(() => `${this.calculatedPageWidth()}px`);

  // --- Estado Interno (No reactivo) ---
  private pdfDoc: any = null;
  private touchStartX = 0;
  private isBrowser = isPlatformBrowser(this.platformId);

  // Control de renderizado
  private isRendering = false;
  private renderQueue: (() => void) | null = null;

  // --- Estado Derivado (Computed) ---
  totalPages = computed(() => this.folios().length * 2);

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
    // 1. Cargar PDF cuando cambia el SRC
    effect(() => {
      const url = this.src();
      if (this.isBrowser && url) {
        untracked(() => this.loadPdf(url));
      }
    });

    // 2. Manejar Resize y Dimensiones
    effect(() => {
      if (!this.isBrowser) return;
      const baseW = this.basePageWidth();
      const fs = this.isFullscreen();

      untracked(() => {
        this.checkMobileView();
        this.updateDimensions();
      });
    });

    // 3. CORE DE RENDERIZADO (Aquí estaba el problema)
    effect(() => {
      // LEER todas las dependencias para que el efecto se reactive
      // si CUALQUIERA de estas cambia:
      const _folios = this.folios();
      const _frontEls = this.frontCanvases(); // <--- CRUCIAL: Reactivar cuando existan los canvas
      const _backEls = this.backCanvases(); // <--- CRUCIAL
      const _idx = this.currentFolioIndex();
      const _mobPage = this.currentPageNumber();
      const _width = this.calculatedPageWidth();
      const _fs = this.isFullscreen();

      untracked(() => {
        // Solo intentamos renderizar si hay datos Y elementos en el DOM
        if (this.folios().length > 0 && this.frontCanvases().length > 0) {
          // Usamos setTimeout para asegurar que el "paint" del navegador esté listo
          setTimeout(() => this.scheduleRender(), 100);
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.pdfDoc && (this.pdfDoc as any).destroy) {
      (this.pdfDoc as any).destroy();
    }
  }

  // --- Lógica Principal ---

  async loadPdf(url: string) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;

      const numPages = this.pdfDoc.numPages;
      const newFolios: Folio[] = [];

      for (let p = 1; p <= numPages; p += 2) {
        newFolios.push({
          front: p,
          back: p + 1 <= numPages ? p + 1 : null,
          flipped: false,
        });
      }

      // Esto disparará el Effect #3, pero inicialmente frontCanvases estará vacío
      // Angular renderizará el HTML, frontCanvases se llenará, y el Effect #3
      // se disparará DE NUEVO automáticamente.
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
    }
  }

  // --- Renderizado ---

  scheduleRender() {
    if (this.isRendering) {
      this.renderQueue = () => this.renderVisibleFolios();
      return;
    }
    this.renderVisibleFolios();
  }

  async renderVisibleFolios() {
    if (!this.pdfDoc) return;
    this.isRendering = true;

    // Obtenemos los elementos nativos actuales
    const frontEls = this.frontCanvases();
    const backEls = this.backCanvases();

    // Validación de seguridad extra
    if (!frontEls || frontEls.length === 0) {
      this.isRendering = false;
      return;
    }

    const promises: Promise<void>[] = [];
    const currentIndex = this.currentFolioIndex();

    // Determinar rango visible
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

      // Nota: Accedemos por índice, asumiendo que el @for mantiene el orden
      if (folio.front && frontEls[i]) {
        promises.push(this.renderPageToCanvas(folio.front, frontEls[i].nativeElement));
      }
      if (folio.back && backEls[i]) {
        promises.push(this.renderPageToCanvas(folio.back, backEls[i].nativeElement));
      }
    }

    await Promise.all(promises);

    this.isRendering = false;

    if (this.renderQueue) {
      const nextTask = this.renderQueue;
      this.renderQueue = null;
      nextTask();
    }
  }

  async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });

      let targetWidth: number;
      if (this.isMobileFullscreen()) {
        targetWidth = this.calculatedPageWidth();
      } else {
        targetWidth = this.calculatedPageWidth() / 2;
      }

      // Calcular escala
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Verificar si ya está renderizado para ahorrar recursos (opcional)
      // if (canvas.width === scaledViewport.width) return;

      // Double buffering para evitar parpadeos
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
      // Limpiar antes de dibujar
      visibleCtx.clearRect(0, 0, canvas.width, canvas.height);
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
    } else {
      if (this.currentFolioIndex() <= 0) return;
      this.isTurning.set(true);
      this.currentFolioIndex.update((i) => i - 1);

      this.folios.update((fs) => {
        const copy = [...fs];
        copy[this.currentFolioIndex()].flipped = false;
        return copy;
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
        const copy = [...fs];
        copy[this.currentFolioIndex()].flipped = true;
        return copy;
      });

      setTimeout(() => {
        this.currentFolioIndex.update((i) => i + 1);
        this.isTurning.set(false);
      }, 600);
      return;
    }

    setTimeout(() => this.isTurning.set(false), 300);
  }

  public goToPage(pageNumber: number) {
    if (this.folios().length === 0) return;

    let targetIndex = pageNumber <= 1 ? 0 : Math.floor((pageNumber - 2) / 2) + 1;
    if (targetIndex >= this.folios().length) targetIndex = this.folios().length - 1;

    this.folios.update((fs) =>
      fs.map((f, i) => ({
        ...f,
        flipped: i < targetIndex,
      }))
    );

    this.currentFolioIndex.set(targetIndex);
    if (this.isMobileView()) {
      this.currentPageNumber.set(pageNumber);
    }
  }

  // --- Eventos ---

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

  // --- Fullscreen ---

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

    if (isFull && this.isMobileView()) {
      this.currentPageNumber.set(this.currentFolioIndex() * 2 + 1);
    }
  }

  async calculateFullscreenSize() {
    if (!this.pdfDoc) return;
    try {
      const page = await this.pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const ar = viewport.width / viewport.height;

      const availW = window.innerWidth - 40;
      const availH = window.innerHeight - 120;

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

  // --- UI Helpers ---

  getZIndex(index: number): number {
    const cur = this.currentFolioIndex();
    const isFlipped = this.folios()[index].flipped;

    if (isFlipped && index >= cur - 1 && index <= cur) return 100;
    if (index < cur) return 10 + index;
    if (index === cur) return 100;
    return 50 - index;
  }

  isFolioVisible(index: number): boolean {
    if (!this.isMobileFullscreen()) {
      return Math.abs(index - this.currentFolioIndex()) <= 2;
    }
    return index === this.currentFolioIndex();
  }

  shouldShowFrontInMobile(): boolean {
    return this.currentPageNumber() % 2 === 1;
  }

  shouldShowBackInMobile(): boolean {
    return this.currentPageNumber() % 2 === 0;
  }
}
