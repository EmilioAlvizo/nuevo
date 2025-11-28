// nuevo/backend/controller/directoriosController.js
const DirectoriosModel = require("../models/directoriosModel");

const TABLE_NAME = "directorio";
const ID_COLUMN = "id_directorio";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class DirectoriosController {
  // GET - Obtener todos los directorios
  static async getAll(req, res) {
    try {
      const directorios = await DirectoriosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: directorios,
        count: directorios.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener un directorio por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const directorio = await DirectoriosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!directorio) {
        return res.status(404).json({
          success: false,
          message: "Directorio no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: directorio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo directorio
static async create(req, res) {
  try {
    const { descripcion, descripcionMas, estatus } = req.body;
    const archivo = req.files?.archivo?.[0];

    // Validación básica
    if (!descripcion || !archivo || !descripcionMas || !estatus) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    // Guardar registro sin imagen primero
    const nuevoDirectorio = await DirectoriosModel.create(TABLE_NAME, {
      descripcion,
      link: archivo.filename, // Aquí guardamos el nombre del archivo
      descripcionMas,
      estatus,
    });

    // Detectar correctamente el ID generado
    const id =
      nuevoDirectorio.insertId ||
      nuevoDirectorio.id_directorio ||
      nuevoDirectorio.id ||
      (Array.isArray(nuevoDirectorio) ? nuevoDirectorio[0]?.id_directorio : undefined);

    if (!id) {
      throw new Error('No se pudo obtener el ID del nuevo directorio');
    }

    const tempPath = `${backendPublicPath}/directorios/temp`;
    const archivoFolder = `${backendPublicPath}/directorios/${id}`;
    fs.mkdirSync(archivoFolder, { recursive: true });

    // Mover el archivo
    if (archivo) {
      const oldPath = path.join(tempPath, archivo.filename);
      const newPath = path.join(archivoFolder, archivo.filename);
      fs.renameSync(oldPath, newPath);
    }

    // Obtener el registro completo después de insertar
    const directorioFinal = await DirectoriosModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Directorio creado correctamente',
      data: directorioFinal,
    });
  } catch (err) {
    console.error('Error al crear directorio:', err);
    res.status(500).json({
      success: false,
      message: 'Error al crear directorio',
      error: err.message,
    });
  }
}
  
// PUT - Actualizar directorio
static async update(req, res) {
  try {
    const { id } = req.params;
    const { descripcion, descripcionMas, estatus } = req.body;
    const archivo = req.files?.archivo?.[0];

    // Validación básica
    if (!descripcion || !descripcionMas || !estatus) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    // Obtener el registro actual para preservar el link si no se envía archivo
    const directorioActual = await DirectoriosModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    let linkActualizado = directorioActual.link; // Preservar el link existente

    // Si se envía un archivo nuevo, actualizar
    if (archivo) {
      const archivoFolder = `${backendPublicPath}/directorios/${id}`;
      fs.mkdirSync(archivoFolder, { recursive: true });

      // Borrar archivo anterior si existe
      if (directorioActual.link) {
        const archivoAnterior = path.join(archivoFolder, directorioActual.link);
        if (fs.existsSync(archivoAnterior)) {
          fs.unlinkSync(archivoAnterior);
        }
      }

      // Mover el nuevo archivo
      const tempPath = `${backendPublicPath}/directorios/temp`;
      const oldPath = path.join(tempPath, archivo.filename);
      const newPath = path.join(archivoFolder, archivo.filename);
      fs.renameSync(oldPath, newPath);

      linkActualizado = archivo.filename;
    }

    // Actualizar con los datos
    await DirectoriosModel.update(
      TABLE_NAME,
      id,
      {
        descripcion,
        link: linkActualizado,
        descripcionMas,
        estatus,
      },
      ID_COLUMN
    );

    // Obtener el registro actualizado
    const directorioActualizado = await DirectoriosModel.getById(TABLE_NAME, id, ID_COLUMN);

    res.json({
      success: true,
      message: 'Directorio actualizado correctamente',
      data: directorioActualizado,
    });
  } catch (err) {
    console.error('Error al actualizar directorio:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar directorio',
      error: err.message,
    });
  }
}


  // DELETE - Eliminar un directorio y sus archivos
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener el registro antes de eliminarlo
      const registro = await DirectoriosModel.getById(TABLE_NAME, id, ID_COLUMN);
      
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Directorio no encontrado",
        });
      }

      // Eliminar el registro de la base de datos
      const deleted = await DirectoriosModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Error al eliminar el directorio",
        });
      }

      // Eliminar carpeta completa del directorio (con todos sus archivos)
      const carpetaDirectorio = path.join(backendPublicPath, 'directorios', id.toString());
      
      if (fs.existsSync(carpetaDirectorio)) {
        fs.rmSync(carpetaDirectorio, { recursive: true, force: true });
        console.log(`Carpeta eliminada: ${carpetaDirectorio}`);
      }

      res.status(200).json({
        success: true,
        message: 'Directorio y archivo eliminados correctamente',
        id: deleted.id,
      });
    } catch (error) {
      console.error('Error al eliminar directorio:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = DirectoriosController;