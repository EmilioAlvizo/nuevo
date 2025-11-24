import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  Inject,
  PLATFORM_ID,
  OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-flipbook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flipbook.html',
  styleUrls: ['./flipbook.css']
})
export class Flipbook implements AfterViewInit, OnDestroy {
  @Input() src!: string;

  @ViewChild('stage') stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('leftCanvas') leftCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rightCanvas') rightCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipForwardFront') flipForwardFront?: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipForwardBack') flipForwardBack?: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipBackFront') flipBackFront?: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipBackBack') flipBackBack?: ElementRef<HTMLCanvasElement>;

  pdfDoc: any = null;
  currentPage = 1;
  totalPages = 0;
  isFullscreen = false;
  isAnimating = false;
  animationDirection: 'forward' | 'back' | null = null;
  zoomLevel = 1;

  private touchStartX = 0;
  private touchEndX = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.src) {
      console.error('Flipbook: src is required');
      return;
    }

    await this.loadPdf(this.src);
    this.renderCurrentSpread();
  }

  ngOnDestroy() {}

  async loadPdf(url: string) {
    try {
      const pdfjsLib = await import('pdfjs-dist/');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
    } catch (err) {
      console.error('Error loading PDF:', err);
    }
  }

  async renderCurrentSpread() {
    if (!this.pdfDoc) return;

    const leftPageNum = this.currentPage;
    const rightPageNum = this.currentPage + 1;

    // Renderizar página izquierda
    if (leftPageNum <= this.totalPages) {
      await this.renderPage(leftPageNum, this.leftCanvas.nativeElement);
    } else {
      this.clearCanvas(this.leftCanvas.nativeElement);
    }

    // Renderizar página derecha
    if (rightPageNum <= this.totalPages) {
      await this.renderPage(rightPageNum, this.rightCanvas.nativeElement);
    } else {
      this.clearCanvas(this.rightCanvas.nativeElement);
    }
  }

  async renderPage(pageNum: number, canvas: HTMLCanvasElement) {
    if (!this.pdfDoc || pageNum > this.totalPages || pageNum < 1) return;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      
      const containerWidth = this.stageRef.nativeElement.offsetWidth / 2;
      const scale = (containerWidth / viewport.width) * 1.5;
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page', pageNum, err);
    }
  }

  clearCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async nextPage() {
    if (this.currentPage >= this.totalPages || this.isAnimating) return;

    this.isAnimating = true;
    this.animationDirection = 'forward';

    // ANTES de la animación: Actualizar la página estática derecha con la NUEVA página
    const newRightPage = this.currentPage + 3; // La que quedará a la derecha después
    if (newRightPage <= this.totalPages) {
      await this.renderPage(newRightPage, this.rightCanvas.nativeElement);
    } else {
      this.clearCanvas(this.rightCanvas.nativeElement);
    }

    // Esperar a que Angular renderice el elemento de la animación
    setTimeout(async () => {
      // Pre-renderizar las páginas que se verán durante la animación
      await this.prepareForwardAnimation();

      // Pequeño delay para iniciar la animación visual
      setTimeout(() => {
        // Esperar a que termine la animación CSS (600ms)
        setTimeout(async () => {
          this.currentPage += 2;
          this.isAnimating = false;
          this.animationDirection = null;
          
          // Actualizar solo la página izquierda (la derecha ya está actualizada)
          const newLeftPage = this.currentPage;
          if (newLeftPage <= this.totalPages) {
            await this.renderPage(newLeftPage, this.leftCanvas.nativeElement);
          } else {
            this.clearCanvas(this.leftCanvas.nativeElement);
          }
        // }, 650);
        }, 50);
      }, 50);
    }, 50);
  }

  async prevPage() {
    if (this.currentPage <= 1 || this.isAnimating) return;

    this.isAnimating = true;
    this.animationDirection = 'back';

    // ANTES de la animación: Actualizar la página estática izquierda con la NUEVA página
    const newLeftPage = this.currentPage - 2; // La que quedará a la izquierda después
    if (newLeftPage > 0) {
      await this.renderPage(newLeftPage, this.leftCanvas.nativeElement);
    } else {
      this.clearCanvas(this.leftCanvas.nativeElement);
    }

    // Esperar a que Angular renderice el elemento de la animación
    setTimeout(async () => {
      // Pre-renderizar las páginas que se verán durante la animación
      await this.prepareBackAnimation();

      // Pequeño delay para iniciar la animación visual
      setTimeout(() => {
        // Esperar a que termine la animación CSS (600ms)
        setTimeout(async () => {
          this.currentPage -= 2;
          this.isAnimating = false;
          this.animationDirection = null;
          
          // Actualizar solo la página derecha (la izquierda ya está actualizada)
          const newRightPage = this.currentPage + 1;
          if (newRightPage <= this.totalPages) {
            await this.renderPage(newRightPage, this.rightCanvas.nativeElement);
          } else {
            this.clearCanvas(this.rightCanvas.nativeElement);
          }
        }, 50);
      }, 50);
    }, 50);
  }

  async prepareForwardAnimation() {
    // Cuando avanzamos, la página derecha voltea
    // Frente: página derecha actual
    // Reverso: siguiente página izquierda (la que quedará a la izquierda después del volteo)
    
    const frontPageNum = this.currentPage + 1; // Página derecha actual
    const backPageNum = this.currentPage + 2;  // Siguiente página izquierda

    // Esperar a que Angular renderice los elementos
    await new Promise(resolve => setTimeout(resolve, 10));

    if (this.flipForwardFront && frontPageNum <= this.totalPages) {
      await this.renderPage(frontPageNum, this.flipForwardFront.nativeElement);
    }

    if (this.flipForwardBack && backPageNum <= this.totalPages) {
      await this.renderPage(backPageNum, this.flipForwardBack.nativeElement);
    }
  }

  async prepareBackAnimation() {
    // Cuando retrocedemos, la página izquierda voltea
    // Frente: página izquierda actual
    // Reverso: página anterior derecha (la que quedará a la derecha después del volteo)
    
    const frontPageNum = this.currentPage;     // Página izquierda actual
    const backPageNum = this.currentPage - 1;  // Página anterior derecha

    // Esperar a que Angular renderice los elementos
    await new Promise(resolve => setTimeout(resolve, 10));

    if (this.flipBackFront && frontPageNum <= this.totalPages) {
      await this.renderPage(frontPageNum, this.flipBackFront.nativeElement);
    }

    if (this.flipBackBack && backPageNum > 0) {
      await this.renderPage(backPageNum, this.flipBackBack.nativeElement);
    }
  }

  zoomIn() {
    if (this.zoomLevel < 2) {
      this.zoomLevel = Math.min(2, this.zoomLevel + 0.25);
    }
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
    }
  }

  toggleFullscreen() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen() {
    const elem = document.querySelector('.flipbook-viewer') as any;
    if (!elem) return;

    const requestFS = elem.requestFullscreen || 
                     elem.webkitRequestFullscreen || 
                     elem.msRequestFullscreen;
    
    if (requestFS) {
      requestFS.call(elem);
      this.isFullscreen = true;
      setTimeout(() => this.renderCurrentSpread(), 300);
    }
  }

  exitFullscreen() {
    const doc = document as any;
    const exitFS = doc.exitFullscreen || 
                  doc.webkitExitFullscreen || 
                  doc.msExitFullscreen;
    
    if (exitFS) {
      exitFS.call(doc);
      this.isFullscreen = false;
      setTimeout(() => this.renderCurrentSpread(), 300);
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  @HostListener('document:msfullscreenchange')
  onFullscreenChange() {
    const doc = document as any;
    const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    
    if (this.isFullscreen !== isFS) {
      this.isFullscreen = isFS;
      setTimeout(() => this.renderCurrentSpread(), 300);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prevPage();
    if (e.key === 'ArrowRight') this.nextPage();
    if (e.key === 'Escape' && this.isFullscreen) this.exitFullscreen();
  }

  @HostListener('window:resize')
  onResize() {
    setTimeout(() => this.renderCurrentSpread(), 100);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    }
  }
}