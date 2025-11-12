//nuevo/backend/controllers/documentos_cendocController.js
const Documentos_cendocModel = require("../models/documentos_cendocModel");
const { parseArrayParam } = require("../utils/filters");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "documentos_cendoc"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_documento"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

class Documentos_cendocController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const municipio = await Documentos_cendocModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: municipio,
        count: municipio.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener un registro por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const revistas = await Documentos_cendocModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!revistas) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: revistas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ NUEVO - GET con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        // Paginación
        limite,
        pagina,

        // Búsqueda global
        busqueda,

        // Filtros de columna con matchMode
        id_documento,
        id_documento_matchMode,

        nombre_documento,
        nombre_documento_matchMode,

        autor_documento,
        autor_documento_matchMode,

        descripcion_documento,
        descripcion_documento_matchMode,

        id_categoria_cendoc,
        id_categoria_cendoc_matchMode,

        archivo_documento,
        archivo_documento_matchMode,

        palabras_clave,
        palabras_clave_matchMode,

        fecha_documento,
        fecha_documento_matchMode,

        fecha_modificacion,
        fecha_modificacion_matchMode,

        // Filtros multiselect (separados por coma)
        estatus_documento,
        nombre_categoria,

        // Ordenamiento
        sortField,
        sortOrder,
      } = req.query;

      // Procesar parámetros
      const params = {
        // Paginación
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,

        // Búsqueda global
        busqueda: busqueda || null,

        // Filtros simples con matchMode
        id_documento: id_documento || null,
        id_documento_matchMode: id_documento_matchMode || "contains",

        nombre_documento: nombre_documento || null,
        nombre_documento_matchMode: nombre_documento_matchMode || "contains",

        autor_documento: autor_documento || null,
        autor_documento_matchMode: autor_documento_matchMode || "contains",

        descripcion_documento: descripcion_documento || null,
        descripcion_documento_matchMode: descripcion_documento_matchMode || "contains",

        id_categoria_cendoc: id_categoria_cendoc || null,
        id_categoria_cendoc_matchMode: id_categoria_cendoc_matchMode || "contains",

        archivo_documento: archivo_documento || null,
        archivo_documento_matchMode: archivo_documento_matchMode || "contains",

        palabras_clave: palabras_clave || null,
        palabras_clave_matchMode: palabras_clave_matchMode || "contains",
        
        /* nombre_categoria: nombre_categoria || null,
        nombre_categoria_matchMode: nombre_categoria_matchMode || "contains", */

        // Filtros de fecha con matchMode
        fecha_documento: fecha_documento || null,
        fecha_documento_matchMode: fecha_documento_matchMode || "dateIs",

        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",

        // Filtros multiselect - convertir strings separadas por coma a arrays
        estatus_documento: estatus_documento
          ? parseArrayParam(estatus_documento, "string")
          : [],
        nombre_categoria: nombre_categoria
          ? parseArrayParam(nombre_categoria, "string")
          : [],

        // Ordenamiento
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,
      };

      const resultado = await Documentos_cendocModel.getArchivosFiltrados(params);

      //console.log("resultados ", resultado)

      res.status(200).json({
        success: true,
        data: resultado.data,
        total: resultado.total,
        pagina: resultado.pagina,
        totalPaginas: resultado.totalPaginas,
        count: resultado.data.length,
      });
    } catch (error) {
      console.error("Error en getFiltrados:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /// ✅ NUEVO - GET conteos por municipio
  static async getConteosDocumentos_cendoc(req, res) {
    try {
      const conteos = await Documentos_cendocModel.getConteosPorDocumentos_cendoc();
      res.status(200).json({
        success: true,
        data: conteos,
        count: conteos.length,
      });
    } catch (error) {
      console.error("Error en getConteosDocumentos_cendoc:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo registro
  static async create(req, res) {
    try {
      const data = req.body;

      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      const newMunicipio = await Documentos_cendocModel.create(TABLE_NAME, data);
      res.status(201).json({
        success: true,
        message: "Registro creado exitosamente",
        data: newMunicipio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      const updatedMunicipio = await Documentos_cendocModel.update(TABLE_NAME, id, data, ID_COLUMN);
      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updatedMunicpio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await Documentos_cendocModel.delete(TABLE_NAME, id, ID_COLUMN);
      
      res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = Documentos_cendocController;