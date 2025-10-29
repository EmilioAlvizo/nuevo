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

// // POST - Crear un nuevo registro
//   static async create(req, res) {
//     try {
//       const data = req.body;

//       if (!data || Object.keys(data).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Datos inválidos o vacíos",
//         });
//       }

//       const newRevista = await RevistasModel.create(TABLE_NAME, data);
//       res.status(201).json({
//         success: true,
//         message: "Registro creado exitosamente",
//         data: newRevista,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

// // PUT - Actualizar un registro
//   static async update(req, res) {
//     try {
//       const { id } = req.params;
//       const data = req.body;

//       if (!data || Object.keys(data).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Datos inválidos o vacíos",
//         });
//       }

//       const updated = await RevistasModel.update(TABLE_NAME, id, data, ID_COLUMN);

//       if (!updated) {
//         return res.status(404).json({
//           success: false,
//           message: "Registro no encontrado o no se pudo actualizar",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Registro actualizado exitosamente",
//         data: updated,
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

// POST - Crear un nuevo registro
  static async create(req, res) {
  try {
    const { volumen, numero_year, descripcion, fecha, estatus } = req.body;

    // Guardar registro sin archivos primero
    const nuevaRevista = await RevistasModel.create({
      volumen, numero_year, descripcion, fecha, estatus
    });

    const id = nuevaRevista.id_revista;

    // Crear carpetas con ID
    const baseFolder = `public/revistas/${id}`;
    const archivosFolder = `${baseFolder}/archivos`;
    const portadasFolder = `${baseFolder}/portadas`;
    fs.mkdirSync(archivosFolder, { recursive: true });
    fs.mkdirSync(portadasFolder, { recursive: true });

    // Mover archivos
    let archivoNombre = null;
    let portadaNombre = null;

    if (req.files['archivo']) {
      const archivo = req.files['archivo'][0];
      archivoNombre = archivo.filename;
    }

    if (req.files['portada']) {
      const portada = req.files['portada'][0];
      portadaNombre = portada.filename;
    }

    // Actualizar registro con nombres de archivo
    await RevistasModel.update(id, { archivo: archivoNombre, portada: portadaNombre });

    res.json({ success: true, data: nuevaRevista });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al crear revista', error: err.message });
  }
  }

// PUT - Actualizar un registro
  static async update(req, res) {
    try {
    const id = req.params.id;
    const data = req.body;

    if (req.files['archivo']) {
      data.archivo = req.files['archivo'][0].filename;
    }
    if (req.files['portada']) {
      data.portada = req.files['portada'][0].filename;
    }

    await revistasModel.actualizar(id, data);

    res.json({ success: true, message: 'Revista actualizada' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al actualizar revista', error: err.message });
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