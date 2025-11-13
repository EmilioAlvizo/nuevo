// const TestimoniosModel = require("../models/testimoniosModel");

// class TestimoniosController {
//   static async getAll(req, res) {
//     try {
//       const items = await TestimoniosModel.getAll();
//       res.status(200).json({
//         success: true,
//         data: items,
//         count: items.length,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   static async getById(req, res) {
//     try {
//       const { id } = req.params;
//       const item = await TestimoniosModel.getById("testimonios", id, "id");

//       if (!item) {
//         return res.status(404).json({
//           success: false,
//           message: "testimonio no encontrado",
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: item,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }
// }

// module.exports = TestimoniosController;


const TestimoniosModel = require("../models/testimoniosModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "testimonios"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_testimonios"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class TestimoniosController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const testimonios = await TestimoniosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: testimonios,
        count: testimonios.length,
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
      const testimonios = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!testimonios) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: testimonios,
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
    const nuevoTema = await TestimoniosModel.create(TABLE_NAME, {
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

    const tempPath = `${backendPublicPath}/testimonios/temp`;
    const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
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
      await TestimoniosModel.update(
        TABLE_NAME,
        id,
        { imagenT: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro completo después de insertar
    const temaFinal = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

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

    const registroActual = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);
    if (!registroActual) {
      return res.status(404).json({
        success: false,
        message: 'Tema no encontrado',
      });
    }

    await TestimoniosModel.update(
      TABLE_NAME,
      id,
      { descripcionTema, estatusTema, link, descripcionMas },
      ID_COLUMN
    );

    const tempPath = `${backendPublicPath}/testimonios/temp`;
    const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
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

      await TestimoniosModel.update(
        TABLE_NAME,
        id,
        { imagenT: imagenFilename },
        ID_COLUMN
      );
    }

    // ✅ Obtener el registro final actualizado
    const temaActualizado = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

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
    const registro = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado",
      });
    }

    // Eliminar el registro de la base de datos
    const deleted = await TestimoniosModel.delete(TABLE_NAME, id, ID_COLUMN);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Error al eliminar el registro",
      });
    }

    // Eliminar carpeta completa del registro (con todos sus archivos)
    const carpetaTema = path.join(backendPublicPath, 'testimonios', id.toString());
    
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

module.exports = TestimoniosController;