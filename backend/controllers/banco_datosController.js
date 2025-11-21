const Banco_datosModel = require("../models/banco_datosModel");

const TABLE_NAME = "documento_banco_datos";
const ID_COLUMN = "id";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class Banco_datosController {
  // GET - Obtener todos los documentos
  static async getAll(req, res) {
    try {
      const documentos = await Banco_datosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: documentos,
        count: documentos.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener un documento por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const documento = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!documento) {
        return res.status(404).json({
          success: false,
          message: "Documento no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: documento,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

//   // POST - Crear un nuevo testimonio
//   static async create(req, res) {
//     try {
//       const { nombreM, id_municipio, correo, telefono, descripcion, estatus } = req.body;

//       // Validación básica
//       if (!nombreM || !id_municipio || !correo || !telefono || !descripcion) {
//         return res.status(400).json({
//           success: false,
//           message: 'Faltan campos requeridos',
//         });
//       }

//       // Guardar registro sin imagen primero
//       const nuevoTestimonio = await Banco_datosModel.create(TABLE_NAME, {
//         nombreM,
//         id_municipio,
//         correo,
//         telefono,
//         descripcion,
//         estatus: estatus || 'A'
//       });

//       // Detectar correctamente el ID generado
//       const id =
//         nuevoTestimonio.insertId ||
//         nuevoTestimonio.id_testimonios ||
//         nuevoTestimonio.id ||
//         (Array.isArray(nuevoTestimonio) ? nuevoTestimonio[0]?.id_testimonios : undefined);

//       if (!id) {
//         throw new Error('No se pudo obtener el ID del nuevo testimonio');
//       }

//       const tempPath = `${backendPublicPath}/testimonios/temp`;
//       const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
//       fs.mkdirSync(imagenFolder, { recursive: true });

//       let imagenFilename = null;

//       // Mover la imagen si existe
//       if (req.files?.imagenT) {
//         const imagen = req.files.imagenT[0];
//         const oldPath = path.join(tempPath, imagen.filename);
//         const newPath = path.join(imagenFolder, imagen.filename);
//         fs.renameSync(oldPath, newPath);
//         imagenFilename = imagen.filename;
//       }

//       // Actualizar campo imagen en BD si aplica
//       if (imagenFilename) {
//         await Banco_datosModel.update(
//           TABLE_NAME,
//           id,
//           { imagenT: imagenFilename },
//           ID_COLUMN
//         );
//       }

//       // Obtener el registro completo después de insertar
//       const testimonioFinal = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

//       res.json({
//         success: true,
//         message: 'Testimonio creado correctamente',
//         data: testimonioFinal,
//       });
//     } catch (err) {
//       console.error('Error al crear testimonio:', err);
//       res.status(500).json({
//         success: false,
//         message: 'Error al crear testimonio',
//         error: err.message,
//       });
//     }
//   }

//   // PUT - Actualizar un testimonio
//   static async update(req, res) {
//     try {
//       const id = req.params.id;
//       const { nombreM, id_municipio, correo, telefono, descripcion, estatus } = req.body;

//       const registroActual = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);
//       if (!registroActual) {
//         return res.status(404).json({
//           success: false,
//           message: 'Testimonio no encontrado',
//         });
//       }

//       // Actualizar datos básicos
//       await Banco_datosModel.update(
//         TABLE_NAME,
//         id,
//         { nombreM, id_municipio, correo, telefono, descripcion, estatus },
//         ID_COLUMN
//       );

//       const tempPath = `${backendPublicPath}/testimonios/temp`;
//       const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
//       fs.mkdirSync(imagenFolder, { recursive: true });

//       let imagenFilename = registroActual.imagenT;

//       // Procesar nueva imagen si existe
//       if (req.files?.imagenT) {
//         const imagen = req.files.imagenT[0];
//         const oldPath = path.join(tempPath, imagen.filename);
//         const newPath = path.join(imagenFolder, imagen.filename);

//         // Borrar imagen anterior si existe
//         if (registroActual.imagenT) {
//           const imagenAnterior = path.join(imagenFolder, registroActual.imagenT);
//           if (fs.existsSync(imagenAnterior)) {
//             fs.unlinkSync(imagenAnterior);
//           }
//         }

//         fs.renameSync(oldPath, newPath);
//         imagenFilename = imagen.filename;

//         await Banco_datosModel.update(
//           TABLE_NAME,
//           id,
//           { imagenT: imagenFilename },
//           ID_COLUMN
//         );
//       }

//       // Obtener el registro final actualizado
//       const testimonioActualizado = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

//       res.json({
//         success: true,
//         message: 'Testimonio actualizado correctamente',
//         data: testimonioActualizado,
//       });
//     } catch (err) {
//       console.error('Error al actualizar testimonio:', err);
//       res.status(500).json({
//         success: false,
//         message: 'Error al actualizar testimonio',
//         error: err.message,
//       });
//     }
//   }

  // DELETE - Eliminar un testimonio y sus archivos
//   static async delete(req, res) {
//     try {
//       const { id } = req.params;
      
//       // Obtener el registro antes de eliminarlo
//       const registro = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);
      
//       if (!registro) {
//         return res.status(404).json({
//           success: false,
//           message: "Testimonio no encontrado",
//         });
//       }

//       // Eliminar el registro de la base de datos
//       const deleted = await Banco_datosModel.delete(TABLE_NAME, id, ID_COLUMN);

//       if (!deleted) {
//         return res.status(404).json({
//           success: false,
//           message: "Error al eliminar el testimonio",
//         });
//       }

//       // Eliminar carpeta completa del testimonio (con todos sus archivos)
//       const carpetaTestimonio = path.join(backendPublicPath, 'testimonios', id.toString());
      
//       if (fs.existsSync(carpetaTestimonio)) {
//         fs.rmSync(carpetaTestimonio, { recursive: true, force: true });
//         console.log(`Carpeta eliminada: ${carpetaTestimonio}`);
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Testimonio e imagen eliminados correctamente',
//         id: deleted.id,
//       });
//     } catch (error) {
//       console.error('Error al eliminar testimonio:', error);
//       res.status(500).json({ 
//         success: false, 
//         message: error.message 
//       });
//     }
//   }
}

module.exports = Banco_datosController;