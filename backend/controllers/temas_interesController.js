
const Temas_interesModel = require("../models/temas_interesModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "tema"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_tema"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class Temas_interesController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const temas = await Temas_interesModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: temas,
        count: temas.length,
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
      const temas = await Temas_interesModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!temas) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: temas,
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
    const { descripcionTema, estatusTema, link, descripcionMas } = req.body;

    // Guardar registro sin archivos primero
    const nuevoTema = await Temas_interesModel.create(TABLE_NAME, {
      descripcionTema, estatusTema, link, descripcionMas
    });

    // ✅ Detectar correctamente el ID generado
    const id =
      nuevoTema.insertId ||
      nuevoTema.id_tema ||
      nuevoTema.id ||
      (Array.isArray(nuevoTema) ? nuevoTema[0]?.id_tema : undefined);

    if (!id) {
      throw new Error('No se pudo obtener el ID del nuevo registro');
    }

    const tempPath = `${backendPublicPath}/temas_interes/temp`;
    const imagenFolder = `${backendPublicPath}/temas_interes/${id}`;
    fs.mkdirSync(imagenFolder, { recursive: true });

    let imagenFilename = null;

    // ✅ Mover la imagen si existe
    if (req.files?.imagen) {
      const imagen = req.files.imagen[0];
      const oldPath = path.join(tempPath, imagen.filename);
      const newPath = path.join(imagenFolder, imagen.filename);
      fs.renameSync(oldPath, newPath);
      imagenFilename = imagen.filename;
    }

    // ✅ Actualizar campo imagen en BD si aplica
    if (imagenFilename) {
      await Temas_interesModel.update(
        TABLE_NAME,
        id,
        { imagen: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro completo después de insertar
    const temaFinal = await Temas_interesModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Tema creado correctamente',
      data: temaFinal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al crear tema de interés',
      error: err.message,
    });
  }
}

// PUT - Actualizar un registro
static async update(req, res) {
  try {
    const id = req.params.id;
    const { descripcionTema, estatusTema, link, descripcionMas } = req.body;

    const registroActual = await Temas_interesModel.getById(TABLE_NAME, id, ID_COLUMN);
    if (!registroActual) {
      return res.status(404).json({
        success: false,
        message: 'Tema no encontrado',
      });
    }

    await Temas_interesModel.update(
      TABLE_NAME,
      id,
      { descripcionTema, estatusTema, link, descripcionMas },
      ID_COLUMN
    );

    const tempPath = `${backendPublicPath}/temas_interes/temp`;
    const imagenFolder = `${backendPublicPath}/temas_interes/${id}`;
    fs.mkdirSync(imagenFolder, { recursive: true });

    let imagenFilename = registroActual.imagen;

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

      await Temas_interesModel.update(
        TABLE_NAME,
        id,
        { imagen: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro final actualizado
    const temaActualizado = await Temas_interesModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Tema actualizado correctamente',
      data: temaActualizado, // 👈 devuelve el objeto completo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tema de interés',
      error: err.message,
    });
  }
}


// DELETE - Eliminar un registro y sus archivos
static async delete(req, res) {
  try {
    const { id } = req.params;
    
    // Obtener el registro antes de eliminarlo para tener los datos
    const registro = await Temas_interesModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    // Eliminar el registro de la base de datos
    const deleted = await Temas_interesModel.delete(TABLE_NAME, id, ID_COLUMN);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Error al eliminar el registro",
      });
    }

    // Eliminar carpeta completa del registro (con todos sus archivos)
    const carpetaTema = path.join(backendPublicPath, 'temas_interes', id.toString());
    
    if (fs.existsSync(carpetaTema)) {
      // Eliminar carpeta recursivamente (carpeta y todo su contenido)
      fs.rmSync(carpetaTema, { recursive: true, force: true });
      console.log(`Carpeta eliminada: ${carpetaTema}`);
    }

    res.status(200).json({
      success: true,
      message: 'Tema e imagen eliminados correctamente',
      id: deleted.id,
    });
  } catch (error) {
    console.error('Error al eliminar tema:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

}

module.exports = Temas_interesController;