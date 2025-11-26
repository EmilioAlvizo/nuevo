
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

  private touchStartX = 0;
  private touchEndX = 0;
  private isRendering = false; // 🔹 NUEVO FLAG
  private renderQueue: (() => void) | null = null; // 🔹 Para encolar renders

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

    this.setStageWidth();
    await this.loadPdf(this.src);
    setTimeout(() => this.renderVisibleFolios(), 50);
  }

setStageWidth() {
  const stage = this.stageRef.nativeElement;
  const root = stage.closest('.flipbook-root') as HTMLElement;
  const isFullscreen = !!document.fullscreenElement;
  
  if (isFullscreen) {
    this.calculateFullscreenSize(); // 🔹 Usar el cálculo proporcional
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
    this.setStageWidth();
    this.scheduleRender(); // 🔹 Usar schedule en lugar de llamar directo
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
    } catch (err) {
      console.error('Error loading PDF', err);
    }
  }

  // 🔹 Nuevo método para programar renders sin conflictos
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

    await Promise.all(renderPromises);
    this.isRendering = false;

    // Si hay un render en cola, ejecutarlo
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
    const targetWidth = this.pageWidth / 2; // 🔹 MANTÉN el /2
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);

    const renderContext = {
      canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D,
      viewport: scaledViewport
    };

    await page.render(renderContext).promise;
  } catch (err) {
    console.error('Error rendering page', pageNumber, err);
  }
}

  prev() {
    if (this.currentFolioIndex <= 0) return;
    this.currentFolioIndex--;
    this.folios[this.currentFolioIndex].flipped = false;
    this.scheduleRender(); // 🔹 Cambiar a schedule
  }

  next() {
    if (this.currentFolioIndex >= this.folios.length - 1) return;
    this.folios[this.currentFolioIndex].flipped = true;
    setTimeout(() => {
      this.currentFolioIndex++;
      this.scheduleRender(); // 🔹 Cambiar a schedule
    }, 600);
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

//   @HostListener('document:fullscreenchange')
// async onFullscreenChange() {
//   const stage = this.stageRef.nativeElement;
//   const root = stage.closest('.flipbook-root') as HTMLElement;
  
//   this.isFullscreen = !!document.fullscreenElement; // 🔹 Actualizar flag
  
//   if (this.isFullscreen) {
//     await this.calculateFullscreenSize();
//     root?.classList.add('fullscreen');
//   } else {
//     this.pageWidth = Math.min(800, window.innerWidth);
//     this.folioHeight = 480;
//     root?.classList.remove('fullscreen');
//   }

//   if (root) {
//     this.renderer.setStyle(root, '--page-width', `${this.pageWidth}px`);
//   }
//   this.scheduleRender();
// }

// Añade esto al final de onFullscreenChange() para ver qué valores se están usando


@HostListener('document:fullscreenchange')
async onFullscreenChange() {
  const stage = this.stageRef.nativeElement;
  const root = stage.closest('.flipbook-root') as HTMLElement;
  
  this.isFullscreen = !!document.fullscreenElement;
  
  if (this.isFullscreen) {
    await this.calculateFullscreenSize();
    root?.classList.add('fullscreen');
  } else {
    this.pageWidth = Math.min(800, window.innerWidth);
    this.folioHeight = 480;
    root?.classList.remove('fullscreen');
  }

  if (root) {
    this.renderer.setStyle(root, '--page-width', `${this.pageWidth}px`);
  }
  
  // 🔹 DEBUG: Mira la altura del book-stage
  setTimeout(() => {
    const computedRoot = window.getComputedStyle(root!);
    const computedStage = window.getComputedStyle(stage);
    
    console.log('📊 CONTENEDORES EN FULLSCREEN:', {
      root_height: computedRoot.height,
      root_display: computedRoot.display,
      root_flexDirection: computedRoot.flexDirection,
      stage_height: computedStage.height,
      stage_offsetHeight: stage.offsetHeight,
      stage_minHeight: computedStage.minHeight,
      folio: this.folioHeight,
      pageWidth: this.pageWidth
    });
  }, 100);
  
  this.scheduleRender();
}



async calculateFullscreenSize() {
  if (!this.pdfDoc) return;
  
  const stage = this.stageRef.nativeElement;
  const root = stage.closest('.flipbook-root') as HTMLElement;
  
  // 🔹 DEBUG INICIAL
  console.log('🔍 calculateFullscreenSize START:', {
    window_innerWidth: window.innerWidth,
    window_innerHeight: window.innerHeight,
    root_offsetWidth: root?.offsetWidth,
    root_offsetHeight: root?.offsetHeight,
    stage_offsetWidth: stage.offsetWidth,
    stage_offsetHeight: stage.offsetHeight
  });
  
  try {
    const page = await this.pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    
    const singlePageAspectRatio = viewport.width / viewport.height;
    
    // 🔹 El cálculo que estás haciendo
    const availableWidth = window.innerWidth - 120;
    const availableHeight = window.innerHeight - 80;
    
    console.log('🔍 Disponible:', {
      availableWidth,
      availableHeight,
      viewport_width: viewport.width,
      viewport_height: viewport.height,
      singlePageAspectRatio
    });
    
    let finalWidth: number;
    let finalHeight: number;
    
    const twoPageWidth = availableWidth;
    const twoPageHeight = twoPageWidth / (singlePageAspectRatio * 2);
    
    if (twoPageHeight <= availableHeight) {
      finalWidth = twoPageWidth;
      finalHeight = twoPageHeight;
    } else {
      finalHeight = availableHeight;
      finalWidth = finalHeight * singlePageAspectRatio * 2;
    }
    
    this.pageWidth = finalWidth;
    this.folioHeight = finalHeight;
    
    console.log('📏 FINAL Calculated size:', {
      finalWidth,
      finalHeight,
      pageWidth: this.pageWidth,
      folioHeight: this.folioHeight
    });
  } catch (err) {
    console.error('Error calculating fullscreen size:', err);
  }
}

}

