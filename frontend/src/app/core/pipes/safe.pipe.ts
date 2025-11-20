// import { Pipe, PipeTransform } from '@angular/core';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// @Pipe({
//   name: 'safe'
// })
// export class SafePipe implements PipeTransform {
//   constructor(private sanitizer: DomSanitizer) {}

//   transform(url: string, type: string): SafeResourceUrl {
//     switch (type) {
//       case 'resourceUrl':
//         return this.sanitizer.bypassSecurityTrustResourceUrl(url);
//       default:
//         return this.sanitizer.bypassSecurityTrustResourceUrl(url);
//     }
//   }
// }

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true      // 👈 Importante
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string, type: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
