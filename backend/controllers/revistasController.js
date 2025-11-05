const RevistasModel = require("../models/revistasModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "revistas"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_revista"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE
const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

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
  static async create(req, res) {
  try {
    const { volumen, numero_year, descripcion, fecha, estatus } = req.body;

    // Guardar registro sin archivos primero
    const nuevaRevista = await RevistasModel.create(TABLE_NAME, {
      volumen, numero_year, descripcion, fecha, estatus
    });

    const id = nuevaRevista.id;
    const tempPath = `${backendPublicPath}/revistas/temp`;
    const baseFolder = `${backendPublicPath}/revistas/${id}`;
    const archivosFolder = `${baseFolder}/archivo`;
    const portadasFolder = `${baseFolder}/portada`;
    fs.mkdirSync(archivosFolder, { recursive: true });
    fs.mkdirSync(portadasFolder, { recursive: true });


    if (req.files?.archivo) {
  const archivo = req.files.archivo[0];
  const oldPath = path.join(tempPath, archivo.filename);
  const newPath = path.join(archivosFolder, archivo.filename);
  fs.renameSync(oldPath, newPath);
}

if (req.files?.portada) {
  const portada = req.files.portada[0];
  const oldPath = path.join(tempPath, portada.filename);
  const newPath = path.join(portadasFolder, portada.filename);
  fs.renameSync(oldPath, newPath);
}


    await RevistasModel.update(TABLE_NAME, id, {
  archivo: req.files?.archivo ? req.files.archivo[0].filename : null,
  portada: req.files?.portada ? req.files.portada[0].filename : null,
}, ID_COLUMN);


    res.json({
      success: true,
      data: { id, ...nuevaRevista },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al crear revista',
      error: err.message,
    });
  }
}


// PUT - Actualizar un registro
static async update(req, res) {
  try {
    const id = req.params.id;
    const { volumen, numero_year, descripcion, fecha, estatus } = req.body;
    
    // IMPORTANTE: Obtener registro actual ANTES de actualizar
    const registroActual = await RevistasModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    // Actualizar campos de texto primero
    await RevistasModel.update(TABLE_NAME, id, {
      volumen, numero_year, descripcion, fecha, estatus
    }, ID_COLUMN);

    const tempPath = `${backendPublicPath}/revistas/temp`;
    const baseFolder = `${backendPublicPath}/revistas/${id}`;
    const archivosFolder = `${baseFolder}/archivo`;
    const portadasFolder = `${baseFolder}/portada`;

    // Asegurar que las carpetas existan
    fs.mkdirSync(archivosFolder, { recursive: true });
    fs.mkdirSync(portadasFolder, { recursive: true });

    const updateData = {};

    // Manejar archivo si viene uno nuevo
    if (req.files?.archivo) {
      const archivo = req.files.archivo[0];
      const oldPath = path.join(tempPath, archivo.filename);
      const newPath = path.join(archivosFolder, archivo.filename);
      
      // Eliminar archivo anterior si existe
      if (registroActual.archivo) {
        const archivoAnterior = path.join(archivosFolder, registroActual.archivo);
        if (fs.existsSync(archivoAnterior)) {
          fs.unlinkSync(archivoAnterior);
        }
      }
      
      fs.renameSync(oldPath, newPath);
      updateData.archivo = archivo.filename;
    }

    // Manejar portada si viene una nueva
    if (req.files?.portada) {
      const portada = req.files.portada[0];
      const oldPath = path.join(tempPath, portada.filename);
      const newPath = path.join(portadasFolder, portada.filename);
      
      // Eliminar portada anterior si existe
      if (registroActual.portada) {
        const portadaAnterior = path.join(portadasFolder, registroActual.portada);
        if (fs.existsSync(portadaAnterior)) {
          fs.unlinkSync(portadaAnterior);
        }
      }
      
      fs.renameSync(oldPath, newPath);
      updateData.portada = portada.filename;
    }

    // Actualizar nombres de archivos en BD si hubo cambios
    if (Object.keys(updateData).length > 0) {
      await RevistasModel.update(TABLE_NAME, id, updateData, ID_COLUMN);
    }

    res.json({
      success: true,
      message: 'Revista actualizada',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar revista',
      error: err.message,
    });
  }
}

// DELETE - Eliminar un registro y sus archivos
static async delete(req, res) {
  try {
    const { id } = req.params;
    
    // Obtener el registro antes de eliminarlo para tener los datos
    const registro = await RevistasModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    // Eliminar el registro de la base de datos
    const deleted = await RevistasModel.delete(TABLE_NAME, id, ID_COLUMN);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Error al eliminar el registro",
      });
    }

    // Eliminar carpeta completa del registro (con todos sus archivos)
    const carpetaRevista = path.join(backendPublicPath, 'revistas', id.toString());
    
    if (fs.existsSync(carpetaRevista)) {
      // Eliminar carpeta recursivamente (carpeta y todo su contenido)
      fs.rmSync(carpetaRevista, { recursive: true, force: true });
      console.log(`Carpeta eliminada: ${carpetaRevista}`);
    }

    res.status(200).json({
      success: true,
      message: 'Revista y archivos eliminados correctamente',
      id: deleted.id,
    });
  } catch (error) {
    console.error('Error al eliminar revista:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

}

module.exports = RevistasController;