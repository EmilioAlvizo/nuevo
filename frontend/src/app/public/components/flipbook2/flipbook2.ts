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
    // --- NUEVOS BINDINGS DE ESTILO ---
    // 1. Asegura que el componente ocupe todo el ancho disponible
    '[style.width]': '"100%"',
    // 2. Centra el componente automáticamente (margin: 0 auto)
    '[style.margin]': '"0 auto"',
    // 3. Vincula el max-width CSS directamente a tu input [pageWidth]
    '[style.max-width.px]': 'basePageWidth()',
    // 4. Asegura comportamiento de bloque
    '[style.display]': '"block"',
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
  private elementRef = inject(ElementRef);

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

  // ============================================
  // 1. NUEVOS SIGNALS PARA ZOOM Y PAN
  // ============================================
  zoomScale = signal(1);
  panX = signal(0);
  panY = signal(0);
  isDragging = signal(false);
  private lastMouseX = 0;
  private lastMouseY = 0;

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
      console.log(
        'width',
        viewport.width,
        'height',
        viewport.height,
        'pages. Aspect Ratio:',
        viewport.width / viewport.height
      );
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

      // Determinar ancho objetivo
      let targetWidth: number;
      if (this.isMobileFullscreen()) {
        targetWidth = this.calculatedPageWidth();
      } else {
        targetWidth = this.calculatedPageWidth() / 2;
      }

      // --- AQUÍ ESTÁ LA MAGIA DE LA ALTA RESOLUCIÓN ---
      // Aumentamos la resolución base para permitir zoom sin pixelar.
      // 2.5 permite un zoom de hasta 250% con nitidez perfecta.
      const ZOOM_QUALITY_FACTOR = 2.5;
      const dpr = window.devicePixelRatio || 1;
      const bleedScale = 1.005; // Tu corrección de bleed existente

      const baseScale = targetWidth / viewport.width;
      // Multiplicamos por el factor de calidad extra
      const outputScale = baseScale * dpr * bleedScale * ZOOM_QUALITY_FACTOR;

      const scaledViewport = page.getViewport({ scale: outputScale });

      // Canvas Offscreen
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.floor(scaledViewport.width);
      offscreen.height = Math.floor(scaledViewport.height);

      const ctx = offscreen.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fondo oscuro para evitar líneas blancas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;

      // Pasar al Canvas Visible
      const visibleCtx = canvas.getContext('2d', { alpha: false });
      if (!visibleCtx) return;

      // El canvas físico tiene el tamaño "gigante" (High Res)
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;

      // CSS (object-fit: fill) se encarga de aplastarlo al tamaño del contenedor,
      // creando una densidad de píxeles muy alta.
      visibleCtx.drawImage(offscreen, 0, 0);
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}`, err);
    }
  }
  // --- Navegación ---
  // ============================================
  // 3. NUEVOS MÉTODOS DE INTERACCIÓN (MOUSE/ZOOM)
  // ============================================

  onWheel(event: WheelEvent) {
    // Solo permitimos zoom en fullscreen para no molestar el scroll de la página normal
    if (this.isFullscreen()) {
      event.preventDefault();
      const delta = -Math.sign(event.deltaY) * 0.25; // Sensibilidad
      const newScale = Math.min(Math.max(this.zoomScale() + delta, 1), 3); // Max zoom 3x

      this.zoomScale.set(newScale);

      // Si volvemos a 1, reseteamos la posición
      if (newScale === 1) {
        this.panX.set(0);
        this.panY.set(0);
      }
    }
  }

  onMouseDown(event: MouseEvent) {
    if (this.zoomScale() > 1 && this.isFullscreen()) {
      this.isDragging.set(true);
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging() && this.zoomScale() > 1) {
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;

      // Actualizamos posición (Pan)
      this.panX.update((v) => v + dx);
      this.panY.update((v) => v + dy);

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseUp() {
    if (this.isDragging()) {
      this.isDragging.set(false);
    }
  }

  // --- Botones de Control ---
  zoomIn() {
    this.zoomScale.update((s) => Math.min(s + 0.5, 3));
  }

  zoomOut() {
    this.zoomScale.update((s) => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) {
        this.panX.set(0);
        this.panY.set(0);
      }
      return newScale;
    });
  }

  resetZoom() {
    this.zoomScale.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

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
    // Forzar renderizado si las dimensiones cambian drásticamente
    if (!this.isRendering) {
      setTimeout(() => this.scheduleRender(), 100);
    }
  }

  checkMobileView() {
    if (!this.isBrowser) return;
    this.isMobileView.set(window.innerWidth < 768);
  }

  updateDimensions() {
    if (!this.isBrowser) return;

    const ar = this.pdfAspectRatio();
    if (!ar) {
      this.folioHeight.set(480);
      return;
    }

    if (this.isFullscreen()) {
      this.calculateFullscreenSize();
    } else {
      // 💻 MODO NORMAL

      const hostElement = this.elementRef.nativeElement;
      // Medimos el ancho real disponible en el DOM
      let containerWidth = hostElement.getBoundingClientRect().width || window.innerWidth;

      // Ajuste de seguridad para márgenes/padding
      containerWidth -= 2;

      // LÓGICA DE TAMAÑO:
      // Usamos el 'basePageWidth' (ej. 1000) como objetivo,
      // pero nunca excedemos el ancho real del contenedor (containerWidth) para que sea responsive.
      const availableWidth = Math.min(this.basePageWidth(), containerWidth);

      console.log(
        `Dimensions -> Target: ${this.basePageWidth()} | Container: ${containerWidth} | Final: ${availableWidth}`
      );

      // Ancho de UNA página (mitad del libro)
      const singlePageWidth = availableWidth / 2;

      // Alto calculado EXACTO según el Aspect Ratio
      const calculatedHeight = singlePageWidth / ar;

      this.calculatedPageWidth.set(availableWidth);
      this.folioHeight.set(calculatedHeight);
    }
  }

  /*  updateDimensions() {
    if (!this.isBrowser) return;

    const ar = this.pdfAspectRatio();

    // Si no hay PDF cargado o ratio, usar un default (A4 aprox) o salir
    if (!ar) {
      this.folioHeight.set(480); // Default
      return;
    }

    if (this.isFullscreen()) {
      this.calculateFullscreenSize();
    } else {
      // 💻 MODO NORMAL/ESCRITORIO (Incrustado en la página)

      // 1. Calcular ancho disponible (restando márgenes del contenedor padre si fuera necesario)
      // Usamos el input basePageWidth como máximo, pero nos adaptamos a la pantalla
      let availableWidth = Math.min(this.basePageWidth()); // 32px de padding seguro
      console.log('Available Width:', availableWidth);
      // 2. En modo escritorio/normal siempre mostramos "libro abierto" (2 páginas)
      // Por tanto, el ancho de UNA página es la mitad del ancho total
      const singlePageWidth = availableWidth / 2;
      console.log('singlePageWidth Width:', singlePageWidth);

      // 3. Calcular altura basada estrictamente en el Aspect Ratio
      // AR = Width / Height  ->  Height = Width / AR
      const calculatedHeight = singlePageWidth / ar;
      
      console.log('calculatedHeight Width:', calculatedHeight);

      this.calculatedPageWidth.set(availableWidth);
      this.folioHeight.set(calculatedHeight);
    }
  } */

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

    // Resetear zoom al salir de pantalla completa
    if (!isFull) {
      this.resetZoom();
    }

    this.updateDimensions();
  }

  async calculateFullscreenSize() {
    if (!this.pdfDoc) return;
    try {
      // Usamos el signal ya calculado si existe, sino lo calculamos
      let ar = this.pdfAspectRatio();
      if (!ar) {
        const page = await this.pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        ar = viewport.width / viewport.height;
        this.pdfAspectRatio.set(ar);
      }

      const availW = window.innerWidth;
      const availH = window.innerHeight;

      if (this.isMobileView()) {
        // 📱 MÓVIL FULLSCREEN: 1 sola página
        // Intentamos ajustar por ancho
        let targetW = availW;
        let targetH = targetW / ar;

        // Si se sale de alto, ajustamos por alto
        if (targetH > availH) {
          targetH = availH;
          targetW = targetH * ar;
        }

        this.calculatedPageWidth.set(targetW);
        this.folioHeight.set(targetH);
      } else {
        // 💻 ESCRITORIO FULLSCREEN: 2 páginas (Libro abierto)
        // El AR del "libro" es el doble de ancho que una página sola
        const doublePageAR = ar * 2;

        let targetW = availW;
        let targetH = targetW / doublePageAR; // (Width / 2) / AR es lo mismo que Width / (AR*2)

        // Si se sale de alto, ajustamos por alto
        if (targetH > availH) {
          targetH = availH;
          targetW = targetH * doublePageAR;
        }

        this.calculatedPageWidth.set(targetW);
        this.folioHeight.set(targetH);
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
