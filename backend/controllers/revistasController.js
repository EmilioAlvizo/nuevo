const RevistasModel = require("../models/revistasModel");
const upload = require("../config/upload");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "revistas"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_revista"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

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
  // static async create(req, res) {
  //   try {
  //     const data = req.body;

  //     if (!data || Object.keys(data).length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Datos inválidos o vacíos",
  //       });
  //     }

  //     const newRevista = await RevistasModel.create(TABLE_NAME, data);
  //     res.status(201).json({
  //       success: true,
  //       message: "Registro creado exitosamente",
  //       data: newRevista,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }

   // POST - Crear revista con archivos
  static async create(req, res) {
    try {
      // 1️⃣ Extraer datos sin archivos
      const { volumen, numero_year, descripcion, fecha, estatus } = req.body;

      if (!volumen || !numero_year || !descripcion || !fecha || !estatus) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
      }

      // 2️⃣ Crear revista en la BD
      const newRevista = await RevistasModel.create(TABLE_NAME, {
        volumen,
        numero_year,
        descripcion,
        fecha,
        estatus,
        archivo: "",   // temporal, se actualizará después
        portada: "",   // temporal
        fecha_modificacion: new Date()
      });

      const revistaId = newRevista.id;
      req.revistaId = revistaId; // importante para multer

      // 3️⃣ Subir archivos (portada y archivo)
      upload.fields([
        { name: "portada", maxCount: 1 },
        { name: "archivo", maxCount: 1 }
      ])(req, res, async (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        // 4️⃣ Guardar rutas finales en la BD
        const archivosActualizados = {};

        if (req.files["portada"] && req.files["portada"][0]) {
          archivosActualizados.portada = req.files["portada"][0].path.replace("public/", "");
        }

        if (req.files["archivo"] && req.files["archivo"][0]) {
          archivosActualizados.archivo = req.files["archivo"][0].path.replace("public/", "");
        }

        const updatedRevista = await RevistasModel.update(
          TABLE_NAME,
          revistaId,
          archivosActualizados,
          ID_COLUMN
        );

        return res.status(201).json({
          success: true,
          message: "Revista creada correctamente",
          data: updatedRevista
        });
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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

      const updatedRevista = await RevistasModel.update(TABLE_NAME, id, data, ID_COLUMN);
      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updatedRevista,
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
      const result = await RevistasModel.delete(TABLE_NAME, id, ID_COLUMN);
      
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

module.exports = RevistasController;