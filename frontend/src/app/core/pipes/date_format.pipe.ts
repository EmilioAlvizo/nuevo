// nuevo/frontend/src/app/core/pipes/date-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: any, format: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'medium', customFormat?: Intl.DateTimeFormatOptions): string {
    if (!value) return '';

    const date = new Date(value);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return '';

    const locale = 'es-MX';

    // Formatos predefinidos
    const formats: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' }, // 05/11/2025
      medium: { year: 'numeric', month: 'short', day: 'numeric' },   // 5 nov 2025
      long: { year: 'numeric', month: 'long', day: 'numeric' },      // 5 de noviembre de 2025
      full: { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }, // miércoles, 5 de noviembre de 2025
    };

    const options = format === 'custom' && customFormat 
      ? customFormat 
      : formats[format];

    return date.toLocaleDateString(locale, options);
  }
}