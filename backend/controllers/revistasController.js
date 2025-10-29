const RevistasModel = require("../models/revistasModel");
const upload = require("../config/upload");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "revistas"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_revista"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE



const path = require("path");
const fs = require("fs");





class RevistasController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const revistas = await RevistasModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: revistas,
        count: revistas.length,
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
      const revistas = await RevistasModel.getById(TABLE_NAME, id, ID_COLUMN);

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

      const newRevista = await RevistasModel.create(TABLE_NAME, data);
      res.status(201).json({
        success: true,
        message: "Registro creado exitosamente",
        data: newRevista,
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

      const updated = await RevistasModel.update(TABLE_NAME, id, data, ID_COLUMN);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado o no se pudo actualizar",
        });
      }

      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

// DELETE - Eliminar un registro registro
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await RevistasModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado o ya fue eliminado",
        });
      }

      res.status(200).json({
        success: true,
        message: deleted.message,
        id: deleted.id,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RevistasController;