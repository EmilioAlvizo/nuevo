//nuevo/backend/controllers/documentos_cendocController.js
const DocumentosCendocModel = require("../models/documentos_cendocModel");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");


const TABLE_NAME = "documentos_cendoc";
const ID_COLUMN = "id_documento";

class DocumentosCendocController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const data = await DocumentosCendocModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: data,
        count: data.length,
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
      const registro = await DocumentosCendocModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: registro,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener registros con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        // Paginación
        limite,
        pagina,
        
        // Búsqueda global
        busqueda,
        
        // Ordenamiento
        sortField,
        sortOrder,

        // Filtros de columna
        // id_documento
        id_documento,
        id_documento_matchMode,
        // nombre_documento
        nombre_documento,
        nombre_documento_matchMode,
        // autor_documento
        autor_documento,
        autor_documento_matchMode,
        // descripcion_documento
        descripcion_documento,
        descripcion_documento_matchMode,
        // fecha_documento
        fecha_documento,
        fecha_documento_matchMode,
        // id_categoria_cendoc
        id_categoria_cendoc,
        id_categoria_cendoc_matchMode,
        // archivo_documento
        archivo_documento,
        archivo_documento_matchMode,
        // estatus_documento
        estatus_documento,
        estatus_documento_matchMode,
        // fecha_modificacion
        fecha_modificacion,
        fecha_modificacion_matchMode,
        // palabras_clave
        palabras_clave,
        palabras_clave_matchMode,
      } = req.query;

      const params = {
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,
        busqueda: busqueda || null,
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,

        id_documento: id_documento || null,
        id_documento_matchMode: id_documento_matchMode || "contains",
        nombre_documento: nombre_documento || null,
        nombre_documento_matchMode: nombre_documento_matchMode || "contains",
        autor_documento: autor_documento ? parseArrayParam(autor_documento, "string") : [],
        descripcion_documento: descripcion_documento || null,
        descripcion_documento_matchMode: descripcion_documento_matchMode || "contains",
        fecha_documento: fecha_documento || null,
        fecha_documento_matchMode: fecha_documento_matchMode || "dateIs",
        id_categoria_cendoc: id_categoria_cendoc ? parseArrayParam(id_categoria_cendoc, "int") : [],
        archivo_documento: archivo_documento || null,
        archivo_documento_matchMode: archivo_documento_matchMode || "contains",
        estatus_documento: estatus_documento ? parseArrayParam(estatus_documento, "string") : [],
        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",
        palabras_clave: palabras_clave || null,
        palabras_clave_matchMode: palabras_clave_matchMode || "contains",
      };

      const resultado = await DocumentosCendocModel.getFiltrados(params);

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

  // GET - Obtener valores únicos para filtros
  static async getValoresUnicos(req, res) {
    try {
      const valores = await DocumentosCendocModel.getValoresUnicos();
      res.status(200).json({
        success: true,
        data: valores,
      });
    } catch (error) {
      console.error("Error en getValoresUnicos:", error);
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

      // Validar campos requeridos
      validarCamposRequeridos(data, []);

      const nuevoRegistro = await DocumentosCendocModel.create(TABLE_NAME, data);

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: nuevoRegistro,
      });
    } catch (err) {
      console.error(err, err);
      res.status(500).json({
        success: false,
        message: "Error al crear registro",
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;


      const registroActual = await DocumentosCendocModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      await DocumentosCendocModel.update(TABLE_NAME, id, data, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro actualizado correctamente",
      });
    } catch (err) {
      console.error(err, err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar registro",
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 🔍 Verificar existencia
      const registro = await DocumentosCendocModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }


      // 🧾 Eliminar registro en la BD
      await DocumentosCendocModel.delete(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro eliminado correctamente",
        id,
      });
    } catch (err) {
      console.error("Error al eliminar registro:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // 🛠️ Utilidad para parsear parámetros de array
  static parseArrayParam(param, type = "string") {
    if (!param) return [];

    // Si ya es un array, devolverlo
    if (Array.isArray(param)) {
      return type === "int" ? param.map(Number) : param;
    }

    // Si es un string, dividirlo por comas
    const arr = param
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return type === "int" ? arr.map(Number) : arr;
  }
}

module.exports = DocumentosCendocController;
