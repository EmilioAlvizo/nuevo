const Propuestas_accionModel = require("../models/propuestas_accionModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "propuesta_accion"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_propuesta"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

class Propuestas_accionController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const propuesta = await Propuestas_accionModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: propuesta,
        count: propuesta.length,
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
      const propuesta = await Propuestas_accionModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!propuesta) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: propuesta,
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

      const newPropuesta = await Propuestas_accionModel.create(TABLE_NAME, data);
      res.status(201).json({
        success: true,
        message: "Registro creado exitosamente",
        data: newPropuesta,
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

      const updatedPropuesta = await Propuestas_accionModel.update(TABLE_NAME, id, data, ID_COLUMN);
      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updatedPropuesta,
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
      const result = await Propuestas_accionModel.delete(TABLE_NAME, id, ID_COLUMN);
      
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

module.exports = Propuestas_accionController;