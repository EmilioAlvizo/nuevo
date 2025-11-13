const CategoriasCendocModel = require("../models/categorias_cendocModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "categorias_cendoc"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_categoria_cendoc"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

class CategoriasCendocController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const municipio = await CategoriasCendocModel.getAll(TABLE_NAME);
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
      const municipio = await CategoriasCendocModel.getById(TABLE_NAME, id, ID_COLUMN);

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
}

module.exports = CategoriasCendocController;