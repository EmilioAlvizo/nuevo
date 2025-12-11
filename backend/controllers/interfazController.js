const InterfazModel = require("../models/interfazModel");
const path = require("path");
const fs = require("fs");

const backendPublicPath = path.join(__dirname, "../public/interfaz");

class InterfazController {

  static async getAll(req, res) {
    try {
      const data = await InterfazModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const id = req.params.id;
      const data = await InterfazModel.getById(id);

      if (!data) return res.status(404).json({ success: false, message: "No encontrado" });

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // static async create(req, res) {
  //   try {
  //     const { nombre, auxiliar, estatus } = req.body;

  //     // Validación mínima
  //     if (!nombre || !estatus) {
  //       return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  //     }

  //     let archivoNombre = null;

  //     // Crear registro sin imagen primero
  //     const id = await InterfazModel.create({
  //       nombre,
  //       auxiliar,
  //       archivo: null,
  //       estatus
  //     });

  //     // Mover imagen si existe
  //     if (req.files?.archivo) {
  //       const img = req.files.archivo[0];

  //       const destino = path.join(backendPublicPath, id.toString());
  //       fs.mkdirSync(destino, { recursive: true });

  //       const oldPath = img.path;
  //       const newPath = path.join(destino, img.filename);

  //       fs.renameSync(oldPath, newPath);
  //       archivoNombre = img.filename;

  //       await InterfazModel.update(id, {
  //         nombre,
  //         auxiliar,
  //         archivo: archivoNombre,
  //         estatus
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       message: "Registro creado correctamente",
  //       id
  //     });

  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  static async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const registro = await InterfazModel.getById(id);

      if (!registro) {
        return res.status(404).json({ success: false, message: "No encontrado" });
      }

      const { nombre, auxiliar, estatus } = req.body;
      let archivoNombre = registro.archivo;

      const destino = path.join(backendPublicPath, id.toString());
      fs.mkdirSync(destino, { recursive: true });

      // Procesar nueva imagen si se envía
      if (req.files?.archivo) {
        const img = req.files.archivo[0];

        // Borrar archivo viejo
        if (archivoNombre) {
          const oldFile = path.join(destino, archivoNombre);
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }

        const newPath = path.join(destino, img.filename);
        fs.renameSync(img.path, newPath);
        archivoNombre = img.filename;
      }

      await InterfazModel.update(id, {
        nombre,
        auxiliar,
        archivo: archivoNombre,
        estatus
      });

      res.json({ success: true, message: "Actualizado correctamente" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // static async delete(req, res) {
  //   try {
  //     const id = req.params.id;
  //     const registro = await InterfazModel.getById(id);

  //     if (!registro) {
  //       return res.status(404).json({ success: false, message: "No encontrado" });
  //     }

  //     // Eliminar de BD
  //     const eliminado = await InterfazModel.delete(id);

  //     // Eliminar carpeta con imagen
  //     const carpeta = path.join(backendPublicPath, id.toString());
  //     if (fs.existsSync(carpeta)) {
  //       fs.rmSync(carpeta, { recursive: true, force: true });
  //     }

  //     res.json({ success: true, message: "Eliminado correctamente" });

  //   } catch (err) {
  //     res.status(500).json({ success: false, message: err.message });
  //   }
  // }
}

module.exports = InterfazController;
