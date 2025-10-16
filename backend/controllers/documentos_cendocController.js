//nuevo/backend/controllers/documentos_cendocController.js
const Documentos_cendocModel = require("../models/documentos_cendocModel");

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
      const municipio = await Documentos_cendocModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!municipio) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: municipio,
      });
    } catch (error) {
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