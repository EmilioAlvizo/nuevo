// 📁 nuevo/backend/scripts/crud.config.js

/**
 * Configuración para el generador de CRUD
 *
 * Aquí defines configuraciones específicas para cada tabla
 */

module.exports = {
  // Configuración para la tabla archivos_municipio
  archivos_municipio: {
    // Columnas que deben ser multiselect
    multiselect: [
      "id_municipio",
      "tipo_archivo",
      "categoria_archivo",
      "subcategoria_archivo",
      "estatus_archivo",
      "nombre_municipio",
    ],

    // Columnas que deben ser filtros de fecha
    dateFilters: ["fecha_archivo", "fecha_modificacion"],

    // Columnas que NO deben aparecer en filtros
    excludeFromFilters: [
      "archivo", // El archivo físico no se filtra
    ],

    // 📁 Configuración de tipos de archivo permitidos
    uploadConfig: {
      archivo: ['application/pdf']  // Solo PDFs
    },

    // Relaciones con otras tablas (JOINs)
    joins: [
      {
        table: "municipio",
        alias: "m",
        on: "a.id_municipio = m.id_municipio",
        selectFields: ["m.nombre as nombre_municipio"],
      },
    ],

    // Campos de búsqueda global
    searchFields: ["nombre_archivo", "palabras_clave", "categoria_archivo"],

    // Ordenamiento por defecto
    defaultSort: {
      field: "fecha_modificacion",
      order: "DESC",
    },
  },

  // Configuración para documentos_cendoc
  documentos_cendoc: {
    multiselect: ["estatus_documento", "nombre_categoria", "autor_documento"],

    dateFilters: ["fecha_documento", "fecha_modificacion"],

    excludeFromFilters: ["archivo_documento"],

    joins: [
      {
        table: "categorias_cendoc",
        alias: "m",
        on: "a.id_categoria_cendoc = m.id_categoria_cendoc",
        selectFields: ["m.nombre_categoria_cendoc as nombre_categoria"],
      },
    ],

    searchFields: [
      "nombre_documento",
      "autor_documento",
      "descripcion_documento",
    ],

    defaultSort: {
      field: "id_documento",
      order: "DESC",
    },
  },

  // Configuración para revistas
  revistas: {
    multiselect: ["estatus_revista", "tipo_revista"],

    dateFilters: ["fecha_publicacion", "fecha_modificacion"],

    searchFields: ["titulo", "autor", "editorial"],

    defaultSort: {
      field: "fecha_publicacion",
      order: "DESC",
    },
  },

  // Configuración por defecto para tablas sin configuración específica
  _default: {
    // Auto-detectar multiselect por nombre de columna
    autoDetectMultiselect: true,
    autoDetectPatterns: ["estatus", "tipo", "categoria", "subcategoria"],

    // Auto-detectar fechas
    autoDetectDates: true,

    // Campos de búsqueda por defecto (toma las primeras 5 columnas de texto)
    autoDetectSearchFields: true,
    maxSearchFields: 5,
  },
};
