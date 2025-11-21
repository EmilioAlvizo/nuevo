const ConsejoModel = require("../models/consejoModel");

const TABLE_NAME = "integrantes_consejo";
const ID_COLUMN = "id_integrante";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class ConsejoController {
  // GET - Obtener todos los integrantes
  static async getAll(req, res) {
    try {
      const integrantes = await ConsejoModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: integrantes,
        count: integrantes.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener un integrante por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const integrante = await ConsejoModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!integrante) {
        return res.status(404).json({
          success: false,
          message: "Integrante no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: integrante,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo integrante
  static async create(req, res) {
    try {
      const { nombre, cargo, cargo_consejo, importancia, estatus } = req.body;

      // Validación básica
      if (!nombre || !cargo || !cargo_consejo || !importancia || !estatus) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos',
        });
      }

      // Guardar registro sin imagen primero
      const nuevoIntegrante = await ConsejoModel.create(TABLE_NAME, {
        nombre,
        cargo,
        cargo_consejo,
        importancia,
        estatus: estatus || 'A'
      });

      // Detectar correctamente el ID generado
      const id =
        nuevoIntegrante.insertId ||
        nuevoIntegrante.id_integrante ||
        nuevoIntegrante.id ||
        (Array.isArray(nuevoIntegrante) ? nuevoIntegrante[0]?.id_integrante : undefined);

      if (!id) {
        throw new Error('No se pudo obtener el ID del nuevo integrante');
      }

      const tempPath = `${backendPublicPath}/integrantes_consejo/temp`;
      const imagenFolder = `${backendPublicPath}/integrantes_consejo/${id}`;
      fs.mkdirSync(imagenFolder, { recursive: true });

      let imagenFilename = null;

      // Mover la imagen si existe
      if (req.files?.imagen) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);
        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;
      }

      // Actualizar campo imagen en BD si aplica
      if (imagenFilename) {
        await ConsejoModel.update(
          TABLE_NAME,
          id,
          { imagen: imagenFilename },
          ID_COLUMN
        );
      }

      // Obtener el registro completo después de insertar
      const integranteFinal = await ConsejoModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Integrante creado correctamente',
        data: integranteFinal,
      });
    } catch (err) {
      console.error('Error al crear integrante:', err);
      res.status(500).json({
        success: false,
        message: 'Error al crear integrante',
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un integrante
  static async update(req, res) {
    try {
      const id = req.params.id;
      const { nombre, cargo, cargo_consejo, importancia, estatus } = req.body;

      const registroActual = await ConsejoModel.getById(TABLE_NAME, id, ID_COLUMN);
      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: 'Integrante no encontrado',
        });
      }

      // Actualizar datos básicos
      await ConsejoModel.update(
        TABLE_NAME,
        id,
        { nombre, cargo, cargo_consejo, importancia, estatus },
        ID_COLUMN
      );

      const tempPath = `${backendPublicPath}/integrantes_consejo/temp`;
      const imagenFolder = `${backendPublicPath}/integrantes_consejo/${id}`;
      fs.mkdirSync(imagenFolder, { recursive: true });

      let imagenFilename = registroActual.imagenT;

      // Procesar nueva imagen si existe
      if (req.files?.imagen) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);

        // Borrar imagen anterior si existe
        if (registroActual.imagen) {
          const imagenAnterior = path.join(imagenFolder, registroActual.imagen);
          if (fs.existsSync(imagenAnterior)) {
            fs.unlinkSync(imagenAnterior);
          }
        }

        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;

        await ConsejoModel.update(
          TABLE_NAME,
          id,
          { imagen: imagenFilename },
          ID_COLUMN
        );
      }

      // Obtener el registro final actualizado
      const integranteActualizado = await ConsejoModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Integrante actualizado correctamente',
        data: integranteActualizado,
      });
    } catch (err) {
      console.error('Error al actualizar integrante:', err);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar integrante',
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un integrante y su imagen
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener el registro antes de eliminarlo
      const registro = await ConsejoModel.getById(TABLE_NAME, id, ID_COLUMN);
      
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Integrante no encontrado",
        });
      }

      // Eliminar el registro de la base de datos
      const deleted = await ConsejoModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Error al eliminar integrante",
        });
      }

      // Eliminar carpeta completa del integrante (con todos sus archivos)
      const carpetaIntegrante = path.join(backendPublicPath, 'integrantes_consejo', id.toString());
      
      if (fs.existsSync(carpetaIntegrante)) {
        fs.rmSync(carpetaIntegrante, { recursive: true, force: true });
        console.log(`Carpeta eliminada: ${carpetaIntegrante}`);
      }

      res.status(200).json({
        success: true,
        message: 'Integrante e imagen eliminados correctamente',
        id: deleted.id,
      });
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = ConsejoController;