//nuevo/backend/controllers/archivos_municipioController.js
const ArchivosMunicipioModel = require("../models/archivos_municipioModel");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");

const TABLE_NAME = "archivos_municipio";
const ID_COLUMN = "id_archivo";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");

class ArchivosMunicipioController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const data = await ArchivosMunicipioModel.getAll(TABLE_NAME);
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
      const registro = await ArchivosMunicipioModel.getById(TABLE_NAME, id, ID_COLUMN);

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
        // id_archivo
        id_archivo,
        id_archivo_matchMode,
        // nombre_archivo
        nombre_archivo,
        nombre_archivo_matchMode,
        // fecha_archivo
        fecha_archivo,
        fecha_archivo_matchMode,
        // id_municipio
        id_municipio,
        id_municipio_matchMode,
        // archivo
        archivo,
        archivo_matchMode,
        // estatus_archivo
        estatus_archivo,
        estatus_archivo_matchMode,
        // fecha_modificacion
        fecha_modificacion,
        fecha_modificacion_matchMode,
        // tipo_archivo
        tipo_archivo,
        tipo_archivo_matchMode,
        // categoria_archivo
        categoria_archivo,
        categoria_archivo_matchMode,
        // palabras_clave
        palabras_clave,
        palabras_clave_matchMode,
        // subcategoria_archivo
        subcategoria_archivo,
        subcategoria_archivo_matchMode,
      } = req.query;

      const params = {
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,
        busqueda: busqueda || null,
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,

        id_archivo: id_archivo || null,
        id_archivo_matchMode: id_archivo_matchMode || "contains",
        nombre_archivo: nombre_archivo || null,
        nombre_archivo_matchMode: nombre_archivo_matchMode || "contains",
        fecha_archivo: fecha_archivo || null,
        fecha_archivo_matchMode: fecha_archivo_matchMode || "dateIs",
        id_municipio: id_municipio ? parseArrayParam(id_municipio, "int") : [],
        archivo: archivo || null,
        archivo_matchMode: archivo_matchMode || "contains",
        estatus_archivo: estatus_archivo ? parseArrayParam(estatus_archivo, "string") : [],
        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",
        tipo_archivo: tipo_archivo ? parseArrayParam(tipo_archivo, "string") : [],
        categoria_archivo: categoria_archivo ? parseArrayParam(categoria_archivo, "string") : [],
        palabras_clave: palabras_clave || null,
        palabras_clave_matchMode: palabras_clave_matchMode || "contains",
        subcategoria_archivo: subcategoria_archivo ? parseArrayParam(subcategoria_archivo, "string") : [],
      };

      const resultado = await ArchivosMunicipioModel.getFiltrados(params);

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
      const valores = await ArchivosMunicipioModel.getValoresUnicos();
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

      const nuevoRegistro = await ArchivosMunicipioModel.create(TABLE_NAME, data);

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: nuevoRegistro,
      });
    } catch (err) {
      console.error(err);
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

      const registroActual = await ArchivosMunicipioModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      await ArchivosMunicipioModel.update(TABLE_NAME, id, data, ID_COLUMN);

      res.json({
        success: true,
        message: "Registro actualizado correctamente",
      });
    } catch (err) {
      console.error(err);
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

      const registro = await ArchivosMunicipioModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      await ArchivosMunicipioModel.delete(TABLE_NAME, id, ID_COLUMN);

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
}

module.exports = ArchivosMunicipioController;
