//nuevo/backend/controllers/archivos_municipioController.js
const Archivos_municipioModel = require("../models/archivos_municipioModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "archivos_municipio"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_archivo"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

class Archivos_municipioController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const municipio = await Archivos_municipioModel.getAll(TABLE_NAME);
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

  // ✅ NUEVO - GET con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        municipios, // "1,2,3" - IDs separados por coma
        busqueda, // Término de búsqueda
        categoria, // Categoría del archivo
        palabra_clave, // Palabra clave específica
        tipo, // Tipo de archivo
        ordenar, // "AZ", "ZA", "masReciente", "masAntiguo"
        limite, // Límite de resultados
        pagina, // Página actual
      } = req.query;

      // Procesar parámetros
      const params = {
        municipios: municipios
          ? municipios.split(",").map((id) => parseInt(id))
          : [],
        busqueda: busqueda || null,
        categoria: categoria || null,
        palabra_clave: palabra_clave || null,
        tipo: tipo || null,
        ordenar: ordenar || "masReciente",
        limite: parseInt(limite) || 50,
        pagina: parseInt(pagina) || 1,
      };

      const resultado = await Archivos_municipioModel.getArchivosFiltrados(
        params
      );

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

  // ✅ NUEVO - GET conteos por municipio
  static async getConteosMunicipio(req, res) {
    try {
      const conteos = await Archivos_municipioModel.getConteosPorMunicipio();
      res.status(200).json({
        success: true,
        data: conteos,
        count: conteos.length,
      });
    } catch (error) {
      console.error("Error en getConteosMunicipio:", error);
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
      const municipio = await Archivos_municipioModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

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

      const newMunicipio = await Archivos_municipioModel.create(
        TABLE_NAME,
        data
      );
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

      const updatedMunicipio = await Archivos_municipioModel.update(
        TABLE_NAME,
        id,
        data,
        ID_COLUMN
      );
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
      const result = await Archivos_municipioModel.delete(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

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

module.exports = Archivos_municipioController;
