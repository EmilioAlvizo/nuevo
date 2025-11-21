// // nuevo/backend/controllers/articulosController.js
// const ArticulosModel = require("../models/articulosModel");
// // const upload = require("../config/upload");

// // Nombre de la tabla (cámbialo según tu tabla)
// const TABLE_NAME = "articulos_revista"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
// const ID_COLUMN = "id_articulo"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

// // const path = require("path");
// // const fs = require("fs");

// class ArticulosController {
//   // GET - Obtener todos los registros
//   static async getAll(req, res) {
//     try {
//       const articulos = await ArticulosModel.getAll(TABLE_NAME);
//       res.status(200).json({
//         success: true,
//         data: articulos,
//         count: articulos.length,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   // GET - Obtener un registro por ID
//   static async getById(req, res) {
//     try {
//       const { id } = req.params;
//       const articulos = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

//       if (!articulos) {
//         return res.status(404).json({
//           success: false,
//           message: "Registro no encontrado",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: articulos,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

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

//       const newArticulo = await ArticulosModel.create(TABLE_NAME, data);
//       res.status(201).json({
//         success: true,
//         message: "Registro creado exitosamente",
//         data: newArticulo,
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

//       const updated = await ArticulosModel.update(TABLE_NAME, id, data, ID_COLUMN);

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




// // DELETE - Eliminar un registro registro
//   static async delete(req, res) {
//     try {
//       const { id } = req.params;
//       const deleted = await ArticulosModel.delete(TABLE_NAME, id, ID_COLUMN);

//       if (!deleted) {
//         return res.status(404).json({
//           success: false,
//           message: "Registro no encontrado o ya fue eliminado",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: deleted.message,
//         id: deleted.id,
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }
// }

// module.exports = ArticulosController;

const ArticulosModel = require("../models/articulosModel");

const TABLE_NAME = "articulos_revista";
const ID_COLUMN = "id_articulo";

const path = require("path");
const fs = require("fs");

const backendPublicPath = path.join(__dirname, "../public");

class ArticulosController {

  // -----------------------------------------------------------
  // GET ALL
  // -----------------------------------------------------------
  static async getAll(req, res) {
    try {
      const articulos = await ArticulosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: articulos,
        count: articulos.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // -----------------------------------------------------------
  // GET BY ID
  // -----------------------------------------------------------
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const articulo = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!articulo) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      res.json({ success: true, data: articulo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // -----------------------------------------------------------
  // CREATE
  // -----------------------------------------------------------
  static async create(req, res) {
    try {
      const { id_revista, titulo, autor, contenido, estatus } = req.body;

      // Validación básica
      if (!id_revista || !titulo || !autor || !contenido) {
        return res.status(400).json({
          success: false,
          message: "Faltan campos requeridos",
        });
      }

      // Crear registro sin imagen primero
      const nuevoArticulo = await ArticulosModel.create(TABLE_NAME, {
        id_revista,
        titulo,
        autor,
        contenido,
        estatus: estatus || "A",
      });

      // Detectar ID generado
      const id =
        nuevoArticulo.insertId ||
        nuevoArticulo.id_articulo ||
        nuevoArticulo.id ||
        (Array.isArray(nuevoArticulo)
          ? nuevoArticulo[0]?.id_articulo
          : undefined);

      if (!id) throw new Error("No se pudo obtener el ID del artículo");

      // Paths
      const tempPath = `${backendPublicPath}/articulos/temp`;
      const carpetaArticulo = `${backendPublicPath}/articulos/${id}`;

      fs.mkdirSync(carpetaArticulo, { recursive: true });

      let imagenFilename = null;

      // Procesar imagen si se envió
      if (req.files?.imagen) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(carpetaArticulo, imagen.filename);

        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;

        await ArticulosModel.update(
          TABLE_NAME,
          id,
          { imagen: imagenFilename },
          ID_COLUMN
        );
      }

      const articuloFinal = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: "Artículo creado correctamente",
        data: articuloFinal,
      });
    } catch (error) {
      console.error("Error al crear artículo:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear artículo",
        error: error.message,
      });
    }
  }

  // -----------------------------------------------------------
  // UPDATE
  // -----------------------------------------------------------
  static async update(req, res) {
    try {
      const { id } = req.params;

      const { id_revista, titulo, autor, contenido, estatus } = req.body;

      const registroActual = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      // Actualizar datos
      await ArticulosModel.update(
        TABLE_NAME,
        id,
        { id_revista, titulo, autor, contenido, estatus },
        ID_COLUMN
      );

      const tempPath = `${backendPublicPath}/articulos/temp`;
      const carpetaArticulo = `${backendPublicPath}/articulos/${id}`;
      fs.mkdirSync(carpetaArticulo, { recursive: true });

      let imagenFilename = registroActual.imagen;

      // Si viene nueva imagen
      if (req.files?.imagen) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(carpetaArticulo, imagen.filename);

        // Eliminar imagen anterior
        if (registroActual.imagen) {
          const anteriorPath = path.join(carpetaArticulo, registroActual.imagen);
          if (fs.existsSync(anteriorPath)) fs.unlinkSync(anteriorPath);
        }

        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;

        await ArticulosModel.update(
          TABLE_NAME,
          id,
          { imagen: imagenFilename },
          ID_COLUMN
        );
      }

      const articuloActualizado = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: "Artículo actualizado correctamente",
        data: articuloActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar artículo:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar artículo",
        error: error.message,
      });
    }
  }

  // -----------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const registro = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Artículo no encontrado",
        });
      }

      const deleted = await ArticulosModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Error al eliminar el artículo",
        });
      }

      const carpetaArticulo = path.join(backendPublicPath, "articulos", id.toString());

      if (fs.existsSync(carpetaArticulo)) {
        fs.rmSync(carpetaArticulo, { recursive: true, force: true });
      }

      res.json({
        success: true,
        message: "Artículo eliminado correctamente",
        id,
      });
    } catch (error) {
      console.error("Error al eliminar artículo:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = ArticulosController;
