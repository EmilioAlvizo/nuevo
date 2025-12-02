import {
  Component,
  Input,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
  Renderer2,
  HostListener,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-flipbook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flipbook.html',
  styleUrls: ['./flipbook.css']
})
export class Flipbook implements AfterViewInit {
  @Input() src!: string;
  @Input() pageWidth = 800;

  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('frontCanvas') frontCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('backCanvas') backCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  pdfDoc: any = null;
  folios: Array<{ front: number | null; back: number | null; flipped: boolean }> = [];
  currentFolioIndex = 0;
  folioHeight = 480;
  isFullscreen = false;
  isMobileView = false;
  currentPageNumber = 1;

  private touchStartX = 0;
  private touchEndX = 0;
  private isRendering = false;
  private renderQueue: (() => void) | null = null;
  private isTurning = false;

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.src) {
      console.error('Flipbook: `src` input is required and should point to a PDF file.');
      return;
    }

    this.checkMobileView();
    this.setStageWidth();
    await this.loadPdf(this.src);
    setTimeout(() => this.renderVisibleFolios(), 50);
  }

  checkMobileView() {
    this.isMobileView = window.innerWidth < 768;
  }

  setStageWidth() {
    const stage = this.stageRef.nativeElement;
    const root = stage.closest('.flipbook-root') as HTMLElement;
    const isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen) {
      this.calculateFullscreenSize();
    } else {
      this.pageWidth = Math.min(800, window.innerWidth);
      this.folioHeight = 480;
    }
    
    if (root) {
      this.renderer.setStyle(root, '--page-width', `${this.pageWidth}px`);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobileView();
    this.setStageWidth();
    this.scheduleRender();
  }

  async loadPdf(url: string) {
    try {
      const pdfjsLib = await import('pdfjs-dist/');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;

      const numPages = this.pdfDoc.numPages;
      this.folios = [];
      for (let p = 1; p <= numPages; p += 2) {
        const front = p;
        const back = (p + 1) <= numPages ? (p + 1) : null;
        this.folios.push({ front, back, flipped: false });
      }
      this.currentFolioIndex = 0;
      this.currentPageNumber = 1;
    } catch (err) {
      console.error('Error loading PDF', err);
    }
  }

  scheduleRender() {
    if (this.isRendering) {
      this.renderQueue = () => this.renderVisibleFolios();
      return;
    }
    this.renderVisibleFolios();
  }

  async renderVisibleFolios() {
    if (this.isRendering) return;
    this.isRendering = true;

    const frontList = this.frontCanvases.toArray();
    const backList = this.backCanvases.toArray();
    const renderPromises: Promise<void>[] = [];

    if (this.isFullscreen && this.isMobileView) {
      // 📱 MÓVIL: Renderizar la página actual y las adyacentes
      const startIdx = Math.max(0, this.currentFolioIndex - 1);
      const endIdx = Math.min(this.folios.length - 1, this.currentFolioIndex + 1);
      
      for (let i = startIdx; i <= endIdx; i++) {
        const folio = this.folios[i];
        
        if (folio.front && frontList[i]) {
          const canvas = frontList[i].nativeElement;
          // Solo renderizar si el canvas no ha sido renderizado (está vacío)
          if (canvas.width === 0 || i === this.currentFolioIndex) {
            renderPromises.push(this.renderPageToCanvas(folio.front, canvas));
          }
        }
        
        if (folio.back && backList[i]) {
          const canvas = backList[i].nativeElement;
          if (canvas.width === 0 || i === this.currentFolioIndex) {
            renderPromises.push(this.renderPageToCanvas(folio.back, canvas));
          }
        }
      }
    } else {
      // 💻 ESCRITORIO: Renderizar folios visibles
      this.folios.forEach((folio, i) => {
        if (Math.abs(i - this.currentFolioIndex) <= 2) {
          if (folio.front && frontList[i]) {
            const canvas = frontList[i].nativeElement;
            renderPromises.push(this.renderPageToCanvas(folio.front, canvas));
          }
          if (folio.back && backList[i]) {
            const canvas = backList[i].nativeElement;
            renderPromises.push(this.renderPageToCanvas(folio.back, canvas));
          }
        }
      });
    }

    await Promise.all(renderPromises);
    this.isRendering = false;

    if (this.renderQueue) {
      const queued = this.renderQueue;
      this.renderQueue = null;
      queued();
    }
  }

  async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
    if (!this.pdfDoc) return;

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });

      let targetWidth: number;
      
      if (this.isFullscreen && this.isMobileView) {
        targetWidth = this.pageWidth;
      } else {
        targetWidth = this.pageWidth / 2;
      }
      
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const offscreen = document.createElement("canvas");
      offscreen.width = scaledViewport.width;
      offscreen.height = scaledViewport.height;

      const ctx = offscreen.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      const visible = canvas.getContext("2d")!;
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      visible.drawImage(offscreen, 0, 0);

    } catch (err) {
      console.error("Error rendering page", pageNumber, err);
    }
  }

//   async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
//   if (!this.pdfDoc) return;

//   // Ocultamos mientras renderizamos
//   canvas.style.visibility = 'hidden';

//   try {
//     const page = await this.pdfDoc.getPage(pageNumber);
//     const viewport = page.getViewport({ scale: 1 });

//     // Tamaño objetivo según modo
//     const targetWidth = (this.isFullscreen && this.isMobileView)
//       ? this.pageWidth
//       : this.pageWidth / 2;

//     // Factor de resolución para alta nitidez
//     const dpr = window.devicePixelRatio || 1;
//     const renderScale = (targetWidth / viewport.width) * dpr;

//     const highResViewport = page.getViewport({ scale: renderScale });

//     // Canvas temporal
//     const offscreen = document.createElement('canvas');
//     offscreen.width = highResViewport.width;
//     offscreen.height = highResViewport.height;

//     const offscreenCtx = offscreen.getContext('2d')!;
//     await page.render({ canvasContext: offscreenCtx, viewport: highResViewport }).promise;

//     // Copiamos al canvas visible
//     canvas.width = highResViewport.width;
//     canvas.height = highResViewport.height;
//     canvas.style.width = `${targetWidth}px`;
//     canvas.style.height = `${highResViewport.height / dpr}px`;

//     const ctx = canvas.getContext('2d')!;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(offscreen, 0, 0);

//     // Mostramos canvas
//     canvas.style.visibility = 'visible';
//   } catch (err) {
//     console.error('Error rendering page', pageNumber, err);
//     canvas.style.visibility = 'visible'; // en caso de error
//   }
// }


  prev() {
    if (this.isTurning) return;
    
    if (this.isFullscreen && this.isMobileView) {
      // 📱 Modo página única
      if (this.currentPageNumber <= 1) return;
      
      this.isTurning = true;
      this.currentPageNumber--;
      this.currentFolioIndex = Math.floor((this.currentPageNumber - 1) / 2);
      
      setTimeout(() => {
        this.scheduleRender();
        this.isTurning = false;
      }, 300);
    } else {
      // 💻 Modo normal
      if (this.currentFolioIndex <= 0) return;
      
      this.isTurning = true;
      this.currentFolioIndex--;
      this.folios[this.currentFolioIndex].flipped = false;
      
      setTimeout(() => {
        this.scheduleRender();
        this.isTurning = false;
      }, 600);
    }
  }

  next() {
    if (this.isTurning) return;
    
    const totalPages = this.pdfDoc ? this.pdfDoc.numPages : this.folios.length * 2;
    
    if (this.isFullscreen && this.isMobileView) {
      // 📱 Modo página única
      if (this.currentPageNumber >= totalPages) return;
      
      this.isTurning = true;
      this.currentPageNumber++;
      this.currentFolioIndex = Math.floor((this.currentPageNumber - 1) / 2);
      
      setTimeout(() => {
        this.scheduleRender();
        this.isTurning = false;
      }, 300);
    } else {
      // 💻 Modo normal
      if (this.currentFolioIndex >= this.folios.length - 1) return;
      
      this.isTurning = true;
      this.folios[this.currentFolioIndex].flipped = true;
      
      setTimeout(() => {
        this.currentFolioIndex++;
        this.scheduleRender();
        this.isTurning = false;
      }, 600);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) this.next();
      else this.prev();
    }
  }

  getZIndex(index: number): number {
    if (this.folios[index].flipped && index >= this.currentFolioIndex - 1 && index <= this.currentFolioIndex) {
      return 100;
    }
    if (index < this.currentFolioIndex) {
      return 10 + index;
    } else if (index === this.currentFolioIndex) {
      return 100;
    } else {
      return 50 - index;
    }
  }

  toggleFullscreen() {
    const root = this.stageRef.nativeElement.closest('.flipbook-root') as HTMLElement;
    if (!document.fullscreenElement) {
      root.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  async onFullscreenChange() {
    const stage = this.stageRef.nativeElement;
    const root = stage.closest('.flipbook-root') as HTMLElement;
    
    this.isFullscreen = !!document.fullscreenElement;
    
    if (this.isFullscreen) {
      await this.calculateFullscreenSize();
      root?.classList.add('fullscreen');
      
      // Sincronizar página al entrar a fullscreen
      if (this.isMobileView) {
        this.currentPageNumber = this.currentFolioIndex * 2 + 1;
      }
    } else {
      this.pageWidth = Math.min(800, window.innerWidth);
      this.folioHeight = 480;
      root?.classList.remove('fullscreen');
    }

    if (root) {
      this.renderer.setStyle(root, '--page-width', `${this.pageWidth}px`);
    }
    
    setTimeout(() => this.scheduleRender(), 100);
  }

  async calculateFullscreenSize() {
    if (!this.pdfDoc) return;
    
    try {
      const page = await this.pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const pageAspectRatio = viewport.width / viewport.height;
      
      const availableWidth = window.innerWidth - 40;
      const availableHeight = window.innerHeight - 120;
      
      if (this.isMobileView) {
        // 📱 MÓVIL: Una sola página (mantener aspect ratio)
        const widthBasedHeight = availableWidth / pageAspectRatio;
        
        if (widthBasedHeight <= availableHeight) {
          // Limita por ancho
          this.pageWidth = availableWidth;
          this.folioHeight = widthBasedHeight;
        } else {
          // Limita por alto
          this.folioHeight = availableHeight;
          this.pageWidth = availableHeight * pageAspectRatio;
        }
      } else {
        // 💻 ESCRITORIO: Dos páginas (mantener aspect ratio)
        const twoPageAspectRatio = pageAspectRatio * 2;
        const widthBasedHeight = availableWidth / twoPageAspectRatio;
        
        if (widthBasedHeight <= availableHeight) {
          this.pageWidth = availableWidth;
          this.folioHeight = widthBasedHeight;
        } else {
          this.folioHeight = availableHeight;
          this.pageWidth = availableHeight * twoPageAspectRatio;
        }
      }
    } catch (err) {
      console.error('Error calculating fullscreen size:', err);
    }
  }

  getCurrentMobilePage(): number {
    return this.currentPageNumber;
  }

  getTotalPages(): number {
    return this.pdfDoc ? this.pdfDoc.numPages : this.folios.length * 2;
  }

  // Helper para determinar si un folio debe estar visible
  isFolioVisible(folioIndex: number): boolean {
    if (!this.isFullscreen || !this.isMobileView) {
      // Modo escritorio: mostrar folios cercanos
      return Math.abs(folioIndex - this.currentFolioIndex) <= 2;
    }
    // Modo móvil: solo el folio actual
    return folioIndex === this.currentFolioIndex;
  }

  // Helper para determinar qué leaf mostrar en móvil
  shouldShowFrontInMobile(): boolean {
    return this.currentPageNumber % 2 === 1;
  }

  shouldShowBackInMobile(): boolean {
    return this.currentPageNumber % 2 === 0;
  }
}