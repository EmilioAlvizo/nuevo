
const Apoyos_serviciosModel = require("../models/apoyos_serviciosModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "apoyos_servicios"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_apoyo"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class Apoyos_serviciosController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const apoyos = await Apoyos_serviciosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: apoyos,
        count: apoyos.length,
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
      const apoyos = await Apoyos_serviciosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!apoyos) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: apoyos,
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
    const { nombre, estatus, link, descripcion } = req.body;

    // Guardar registro sin archivos primero
    const nuevoApoyo = await Apoyos_serviciosModel.create(TABLE_NAME, {
      nombre, estatus, link, descripcion
    });

    // ✅ Detectar correctamente el ID generado
    const id =
      nuevoApoyo.insertId ||
      nuevoApoyo.id_apoyo ||
      nuevoApoyo.id ||
      (Array.isArray(nuevoApoyo) ? nuevoApoyo[0]?.id_apoyo : undefined);

    if (!id) {
      throw new Error('No se pudo obtener el ID del nuevo registro');
    }

    const tempPath = `${backendPublicPath}/apoyos_servicios/temp`;
    const imagenFolder = `${backendPublicPath}/apoyos_servicios/${id}`;
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
      await Apoyos_serviciosModel.update(
        TABLE_NAME,
        id,
        { imagen: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro completo después de insertar
    const apoyoFinal = await Apoyos_serviciosModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Apoyo/servicio creado correctamente',
      data: apoyoFinal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al crear apoyo/servicio de interés',
      error: err.message,
    });
  }
}

// PUT - Actualizar un registro
static async update(req, res) {
  try {
    const id = req.params.id;
    const { nombre, estatus, link, descripcion } = req.body;

    const registroActual = await Apoyos_serviciosModel.getById(TABLE_NAME, id, ID_COLUMN);
    if (!registroActual) {
      return res.status(404).json({
        success: false,
        message: 'Apoyo/servicio no encontrado',
      });
    }

    await Apoyos_serviciosModel.update(
      TABLE_NAME,
      id,
      { nombre, estatus, link, descripcion },
      ID_COLUMN
    );

    const tempPath = `${backendPublicPath}/apoyos_servicios/temp`;
    const imagenFolder = `${backendPublicPath}/apoyos_servicios/${id}`;
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

      await Apoyos_serviciosModel.update(
        TABLE_NAME,
        id,
        { imagen: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro final actualizado
    const apoyoActualizado = await Apoyos_serviciosModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Apoyo/servicio actualizado correctamente',
      data: apoyoActualizado, // 👈 devuelve el objeto completo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar apoyo/servicio',
      error: err.message,
    });
  }
}


// DELETE - Eliminar un registro y sus archivos
static async delete(req, res) {
  try {
    const { id } = req.params;
    
    // Obtener el registro antes de eliminarlo para tener los datos
    const registro = await Apoyos_serviciosModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    // Eliminar el registro de la base de datos
    const deleted = await Apoyos_serviciosModel.delete(TABLE_NAME, id, ID_COLUMN);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Error al eliminar el registro",
      });
    }

    // Eliminar carpeta completa del registro (con todos sus archivos)
    const carpetaApoyo = path.join(backendPublicPath, 'apoyos_servicios', id.toString());
    
    if (fs.existsSync(carpetaApoyo)) {
      // Eliminar carpeta recursivamente (carpeta y todo su contenido)
      fs.rmSync(carpetaApoyo, { recursive: true, force: true });
      //console.log(`Carpeta eliminada: ${carpetaApoyo}`);
    }

    res.status(200).json({
      success: true,
      message: 'Apoyo/servicio e imagen eliminados correctamente',
      id: deleted.id,
    });
  } catch (error) {
    console.error('Error al eliminar apoyo/servicio:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

}

module.exports = Apoyos_serviciosController;