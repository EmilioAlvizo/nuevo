const Banco_datosModel = require("../models/banco_datosModel");

const TABLE_NAME = "banco_datos";
const ID_COLUMN = "id_banco";

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

  // POST - Crear un nuevo testimonio
  static async create(req, res) {
    try {
      const { nombre, tema_designado, atributo, anio_informacion, origen_institucion, origen_documento,
        grupo_edad, nivel_informacion, nombre_gestor, fecha, link, estatus, categoria
       } = req.body;

      // Validación básica
      if (!nombre || !tema_designado || !atributo) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos',
        });
      }

      // Guardar registro sin imagen primero
      const nuevoArchivoBanco = await Banco_datosModel.create(TABLE_NAME, {
        nombre,
        tema_designado,
        atributo,
        anio_informacion,
        origen_institucion,
        origen_documento,
        grupo_edad,
        nivel_informacion,
        nombre_gestor,
        fecha,
        link,
        estatus,
        categoria
      });

      // Detectar correctamente el ID generado
      const id =
        nuevoArchivoBanco.insertId ||
        nuevoArchivoBanco.id_banco ||
        nuevoArchivoBanco.id ||
        (Array.isArray(nuevoArchivoBanco) ? nuevoArchivoBanco[0]?.id_banco : undefined);

      if (!id) {
        throw new Error('No se pudo obtener el ID del nuevo archivo de banco de datos');
      }

      const tempPath = `${backendPublicPath}/banco_datos/temp`;
      const archivoFolder = `${backendPublicPath}/banco_datos/${id}`;
      fs.mkdirSync(archivoFolder, { recursive: true });

      let archivoFilename = null;

      // Mover archivo si existe
      if (req.files?.archivo) {
        const archivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, archivo.filename);
        const newPath = path.join(archivoFolder, archivo.filename);
        fs.renameSync(oldPath, newPath);
        archivoFilename = archivo.filename;
      }

      // Actualizar campo imagen en BD si aplica
      if (archivoFilename) {
        await Banco_datosModel.update(
          TABLE_NAME,
          id,
          { archivo: archivoFilename },
          ID_COLUMN
        );
      }

      // Obtener el registro completo después de insertar
      const archivoBancoFinal = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Archivo de banco de datos creado correctamente',
        data: archivoBancoFinal,
      });
    } catch (err) {
      console.error('Error al crear archivo de banco de datos:', err);
      res.status(500).json({
        success: false,
        message: 'Error al crear archivo de banco de datos',
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un registro de banco de datos
  static async update(req, res) {
    try {
      const id = req.params.id;
      const {
        nombre,
        tema_designado,
        atributo,
        anio_informacion,
        origen_institucion,
        origen_documento,
        grupo_edad,
        nivel_informacion,
        nombre_gestor,
        fecha,
        link,
        estatus,
        categoria
      } = req.body;

      // Obtener el registro actual
      const registroActual = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);
      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado',
        });
      }

      // Actualizar los campos básicos
      await Banco_datosModel.update(
        TABLE_NAME,
        id,
        {
          nombre,
          tema_designado,
          atributo,
          anio_informacion,
          origen_institucion,
          origen_documento,
          grupo_edad,
          nivel_informacion,
          nombre_gestor,
          fecha,
          link,
          estatus,
          categoria,
          fecha_modificacion: new Date()
        },
        ID_COLUMN
      );

      const tempPath = `${backendPublicPath}/banco_datos/temp`;
      const archivoFolder = `${backendPublicPath}/banco_datos/${id}`;
      fs.mkdirSync(archivoFolder, { recursive: true });

      let archivoFilename = registroActual.archivo;

      // Procesar nueva imagen/archivo si existe
      if (req.files?.archivo) {
        const archivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, archivo.filename);
        const newPath = path.join(archivoFolder, archivo.filename);

        // Borrar archivo anterior si existe
        if (registroActual.archivo) {
          const archivoAnterior = path.join(archivoFolder, registroActual.archivo);
          if (fs.existsSync(archivoAnterior)) {
            fs.unlinkSync(archivoAnterior);
          }
        }

        fs.renameSync(oldPath, newPath);
        archivoFilename = archivo.filename;

        // Actualizar campo archivo en la BD
        await Banco_datosModel.update(
          TABLE_NAME,
          id,
          { archivo: archivoFilename, fecha_modificacion: new Date() },
          ID_COLUMN
        );
      }

      // Obtener el registro final actualizado
      const registroActualizado = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Registro de banco de datos actualizado correctamente',
        data: registroActualizado,
      });
    } catch (err) {
      console.error('Error al actualizar registro de banco de datos:', err);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar registro de banco de datos',
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un registro de banco de datos y sus archivos
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Obtener el registro antes de eliminarlo
      const registro = await Banco_datosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      // Eliminar el registro de la base de datos
      const deleted = await Banco_datosModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Error al eliminar el registro",
        });
      }

      // Eliminar carpeta completa del registro (con todos sus archivos)
      const carpetaRegistro = path.join(backendPublicPath, 'banco_datos', id.toString());

      if (fs.existsSync(carpetaRegistro)) {
        fs.rmSync(carpetaRegistro, { recursive: true, force: true });
        console.log(`Carpeta eliminada: ${carpetaRegistro}`);
      }

      res.status(200).json({
        success: true,
        message: 'Registro y archivo eliminados correctamente',
        id: deleted.id_banco || id,
      });
    } catch (error) {
      console.error('Error al eliminar registro de banco de datos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}

module.exports = Banco_datosController;