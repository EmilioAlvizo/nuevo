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

  private touchStartX = 0;
  private touchEndX = 0;

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR: no hacemos nada
      return;
    }

    if (!this.src) {
      console.error('Flipbook: `src` input is required and should point to a PDF file.');
      return;
    }

    this.renderer.setStyle(this.stageRef.nativeElement, '--page-width', `${this.pageWidth}px`);
    await this.loadPdf(this.src);
    setTimeout(() => this.renderVisibleFolios(), 50);
  }

async loadPdf(url: string) {
  try {
    const pdfjsLib = await import('pdfjs-dist/');

    // 👇 Usa el worker desde assets
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


  // renderVisibleFolios() {
  //   const start = Math.max(0, this.currentFolioIndex - 2);
  //   const end = Math.min(this.folios.length - 1, this.currentFolioIndex + 2);

  //   const frontList = this.frontCanvases.toArray();
  //   const backList = this.backCanvases.toArray();

  //   for (let i = start; i <= end; i++) {
  //     const folio = this.folios[i];
  //     const frontCanvasRef = frontList[i];
  //     const backCanvasRef = backList[i];
  //     if (folio.front && frontCanvasRef) this.renderPageToCanvas(folio.front, frontCanvasRef.nativeElement);
  //     if (folio.back && backCanvasRef) this.renderPageToCanvas(folio.back, backCanvasRef.nativeElement);
  //   }
  // }

  renderVisibleFolios() {
  const frontList = this.frontCanvases.toArray();
  const backList = this.backCanvases.toArray();

  this.folios.forEach((folio, i) => {
    if (Math.abs(i - this.currentFolioIndex) <= 2) {
      if (folio.front && frontList[i]) {
        const canvas = frontList[i].nativeElement;
        if (!canvas.dataset['rendered']) {
          this.renderPageToCanvas(folio.front, canvas);
          canvas.dataset['rendered'] = 'true';
        }
      }

      if (folio.back && backList[i]) {
        const canvas = backList[i].nativeElement;
        if (!canvas.dataset['rendered']) {
          this.renderPageToCanvas(folio.back, canvas);
          canvas.dataset['rendered'] = 'true';
        }
      }
    }
  });
}


  async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement) {
    if (!this.pdfDoc) return;
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = this.pageWidth / 2;
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
    this.setFolioFlipped(this.currentFolioIndex, false);
    this.currentFolioIndex -= 1;
    this.renderVisibleFolios();
  }

  next() {
    if (this.currentFolioIndex >= this.folios.length - 1) return;
    this.setFolioFlipped(this.currentFolioIndex, true);
    this.currentFolioIndex += 1;
    this.renderVisibleFolios();
  }

  toggleFolio(index: number) {
    const folio = this.folios[index];
    folio.flipped = !folio.flipped;
    this.currentFolioIndex = Math.max(0, Math.min(this.folios.length - 1, index));
    this.renderVisibleFolios();
  }

  setFolioFlipped(index: number, flipped: boolean) {
    if (this.folios[index]) this.folios[index].flipped = flipped;
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
    this.handleSwipe();
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) this.next(); // swipe left
      else this.prev(); // swipe right
    }
  }
}

// import { Component, ElementRef, Renderer2, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// @Component({
//   selector: 'app-flipbook',
//   standalone: true,
//   templateUrl: './flipbook.html',
//   styleUrls: ['./flipbook.css'],
// })
// export class Flipbook implements AfterViewInit {
//   @ViewChild('book', { static: true }) bookRef!: ElementRef;

//   pdfSrc = 'flipbook/revista.pdf';
//   currentStep = 0;
//   totalPages = 0;
//   pages: HTMLElement[] = [];

//   constructor(
//     private renderer: Renderer2,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {
//     GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
//   }

//   get isBrowser(): boolean {
//     return isPlatformBrowser(this.platformId);
//   }

//   async ngAfterViewInit() {
//     if (!this.isBrowser) return;

//     const pdf = await getDocument(this.pdfSrc).promise;
//     this.totalPages = pdf.numPages;

//     const isMobile = window.innerWidth <= 768;

//     for (let i = 1; i <= this.totalPages; i++) {
//       const page = await pdf.getPage(i);
//       const viewport = page.getViewport({ scale: 1.3 });

//       const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
//       canvas.width = viewport.width;
//       canvas.height = viewport.height;

//       await page.render({
//         canvas,
//         canvasContext: canvas.getContext('2d')!,
//         viewport,
//       }).promise;

//       const wrapper = this.renderer.createElement('div');
//       this.renderer.addClass(wrapper, 'paper');
//       wrapper.appendChild(canvas);

//       this.renderer.appendChild(this.bookRef.nativeElement, wrapper);

//       if (i === 1) {
//         this.renderer.addClass(wrapper, 'visible');
//       }

//       this.pages.push(wrapper);
//     }

//     this.applyInitialZIndices();
//   }

//   public onBookClick(event: MouseEvent) {
//     const isMobile = window.innerWidth <= 768;
//     const bookElement = this.bookRef.nativeElement;
//     const clickX = event.clientX - bookElement.getBoundingClientRect().left;
//     const bookWidth = bookElement.offsetWidth;

//     const isForward = clickX > bookWidth / 2;
//     const isBackward = clickX <= bookWidth / 2;

//     this.renderer.removeClass(bookElement, 'started');
//     this.renderer.removeClass(bookElement, 'end');

//     if (isMobile) {
//       if (isForward && this.currentStep < this.pages.length) {
//         if (!this.pages[this.currentStep].parentElement) {
//           this.renderer.appendChild(bookElement, this.pages[this.currentStep]);
//         }
//         void this.pages[this.currentStep].offsetWidth;

//         this.pages[this.currentStep].classList.add('flipped', 'visible');
//         this.currentStep++;
//       } else if (isBackward && this.currentStep > 0) {
//         this.currentStep--;
//         this.pages[this.currentStep].classList.remove('flipped');
//         setTimeout(() => {
//           this.pages[this.currentStep].classList.remove('visible');
//         }, 300);
//       }
//     } else {
//       if (isForward && this.currentStep < this.pages.length - 1) {
//         const leftPage = this.pages[this.currentStep];
//         const rightPage = this.pages[this.currentStep + 1];

//         if (!leftPage.parentElement) {
//           this.renderer.appendChild(bookElement, leftPage);
//         }
//         if (rightPage && !rightPage.parentElement) {
//           this.renderer.appendChild(bookElement, rightPage);
//         }

//         void leftPage.offsetWidth;

//         leftPage.classList.add('flipped', 'visible');
//         if (rightPage) {
//           rightPage.classList.add('flipped', 'visible');
//         }

//         this.currentStep += 2;
//       } else if (isBackward && this.currentStep >= 2) {
//         this.currentStep -= 2;
//         const leftPage = this.pages[this.currentStep];
//         const rightPage = this.pages[this.currentStep + 1];

//         leftPage.classList.remove('flipped');
//         if (rightPage) {
//           rightPage.classList.remove('flipped');
//         }

//         setTimeout(() => {
//           leftPage.classList.remove('visible');
//           if (rightPage) {
//             rightPage.classList.remove('visible');
//           }
//         }, 300);
//       }
//     }

//     if (this.currentStep === 0) {
//       this.renderer.addClass(bookElement, 'end');
//     } else {
//       this.renderer.addClass(bookElement, 'started');
//     }
//   }

//   private applyInitialZIndices() {
//     const count = this.pages.length;
//     for (let i = 0; i < count; i++) {
//       this.pages[i].style.zIndex = `${count - i}`;
//     }
//   }
// }
