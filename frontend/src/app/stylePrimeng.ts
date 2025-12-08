//mypreset.ts
import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}',
    },
    text: {
      color: {
        colorScheme: {
          light: '{surface.900}', // texto oscuro en modo claro
          dark: '{surface.50}', // texto claro en modo oscuro
        },
      },
    },
    translation: {
      matchAll: 'Coincide con todos',
      matchAny: 'Coincide con cualquiera',
      dateAfter: 'Fecha posterior a',
      dateBefore: 'Fecha anterior a',
      startsWith: 'Comienza con',
      contains: 'Contiene',
      notContains: 'No contiene',
      endsWith: 'Termina con',
      equals: 'Igual a',
      notEquals: 'No es igual a',
      noFilter: 'Sin filtro',
      clear: 'Limpiar',
      apply: 'Aplicar',
      //matchMode: 'Modo de coincidencia',
      //first: 'Primero',
      //last: 'Último',
      //next: 'Siguiente',
      //previous: 'Anterior',
      emptyMessage: 'No hay resultados',
      emptyFilterMessage: 'Sin datos',
      //filter: 'Filtrar',
      //add: 'Añadir',
      //remove: 'Eliminar',
      cancel: 'Cancelar',
    },
  },
});

/* const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{sky.600}',
          inverseColor: '#ffffff',
          hoverColor: '{sky.500}',
          activeColor: '{sky.400}',
        },
        highlight: {
          background: '{sky.600}',
          focusBackground: '{sky.400}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{sky.50}',
          inverseColor: '{sky.950}',
          hoverColor: '{sky.100}',
          activeColor: '{sky.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
    translation: {
      matchAll: 'Coincide con todos',
      matchAny: 'Coincide con cualquiera',
      dateAfter: 'Fecha posterior a',
      dateBefore: 'Fecha anterior a',
      startsWith: 'Comienza con',
      contains: 'Contiene',
      notContains: 'No contiene',
      endsWith: 'Termina con',
      equals: 'Igual a',
      notEquals: 'No es igual a',
      noFilter: 'Sin filtro',
      clear: 'Limpiar',
      apply: 'Aplicar',
      //matchMode: 'Modo de coincidencia',
      //first: 'Primero',
      //last: 'Último',
      //next: 'Siguiente',
      //previous: 'Anterior',
      emptyMessage: 'No hay resultados',
      emptyFilterMessage: 'Sin datos',
      //filter: 'Filtrar',
      //add: 'Añadir',
      //remove: 'Eliminar',
      cancel: 'Cancelar',
    },
  },
}); */

export default MyPreset;
