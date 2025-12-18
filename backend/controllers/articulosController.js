//nuevo/backend/controllers/articulosController.js
const ArticulosModel = require("../models/articulosModel");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");

const TABLE_NAME = "articulos";
const ID_COLUMN = "id_articulo";

class ArticulosController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const data = await ArticulosModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: data,
        count: data.length,
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
      const registro = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: registro,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener registros con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        // Paginación
        limite,
        pagina,

        // Búsqueda global
        busqueda,

        // Ordenamiento
        sortField,
        sortOrder,

        // Filtros de columna
        id_articulo,
        id_articulo_matchMode,
        titulo,
        titulo_matchMode,
        autor,
        autor_matchMode,
        contenido,
        contenido_matchMode,
        estatus,
        estatus_matchMode,
        fecha_modificacion,
        fecha_modificacion_matchMode,
      } = req.query;

      const params = {
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,
        busqueda: busqueda || null,
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,

        id_articulo: id_articulo || null,
        id_articulo_matchMode: id_articulo_matchMode || "contains",
        titulo: titulo || null,
        titulo_matchMode: titulo_matchMode || "contains",
        autor: autor ? parseArrayParam(autor, "string") : [],
        contenido: contenido || null,
        contenido_matchMode: contenido_matchMode || "contains",
        estatus: estatus ? parseArrayParam(estatus, "string") : [],
        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs"
      };

      const resultado = await ArticulosModel.getFiltrados(params);

      res.status(200).json({
        success: true,
        data: resultado.data,
        total: resultado.total,
        pagina: resultado.pagina,
        totalPaginas: resultado.totalPaginas,
        count: resultado.data.length,
      });
    } catch (error) {
      console.error("Error en getFiltrados:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET - Obtener valores únicos para filtros
  static async getValoresUnicos(req, res) {
    try {
      const valores = await ArticulosModel.getValoresUnicos();
      res.status(200).json({
        success: true,
        data: valores,
      });
    } catch (error) {
      console.error("Error en getValoresUnicos:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo registro
  static async create(req, res) {
    try {
      const { titulo, autor, contenido, estatus } = req.body;

      // 🕓 Convertir la fecha al horario local de Ciudad de México
      const moment = require("moment-timezone");
      const fechaLocal = moment
        .tz(new Date(), "America/Mexico_City")
        .format("YYYY-MM-DDTHH:mm:ss");

      // Validar campos requeridos
      validarCamposRequeridos({ titulo, autor, contenido, estatus }, []);

      // 1️⃣ Crear el registro primero (sin archivos)
      const nuevoRegistro = await ArticulosModel.create(TABLE_NAME, {
        titulo,
        autor,
        contenido,
        estatus,
        fecha_modificacion: fechaLocal,
        imagen: null,
        archivo: null
      });

      const id = nuevoRegistro.id || nuevoRegistro.id_articulo || nuevoRegistro.insertId;
      if (!id) throw new Error("No se pudo obtener el ID del nuevo registro");

      // 2️⃣ Definir carpetas
      const tempPath = path.join(backendPublicPath, 'articulos', 'temp');
      const baseFolder = path.join(backendPublicPath, 'articulos', id.toString());
      const imagenFolder = path.join(baseFolder, 'imagen');
      const archivoFolder = path.join(baseFolder, 'archivo');
      
      fs.mkdirSync(imagenFolder, { recursive: true });
      fs.mkdirSync(archivoFolder, { recursive: true });

      // 3️⃣ Procesar archivos
      const archivosActualizados = {};

      // Mover imagen
      if (req.files?.imagen) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);
        fs.renameSync(oldPath, newPath);
        archivosActualizados.imagen = imagen.filename;
      }

      // Mover archivo PDF
      if (req.files?.archivo) {
        const archivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, archivo.filename);
        const newPath = path.join(archivoFolder, archivo.filename);
        fs.renameSync(oldPath, newPath);
        archivosActualizados.archivo = archivo.filename;
      }

      // 4️⃣ Actualizar registro con archivos
      if (Object.keys(archivosActualizados).length > 0) {
        await ArticulosModel.update(TABLE_NAME, id, archivosActualizados, ID_COLUMN);
      }

      res.status(201).json({
        success: true,
        message: "Artículo creado correctamente",
        data: { id, ...nuevoRegistro, ...archivosActualizados },
      });
    } catch (err) {
      console.error("💥 Error en create articulos:", err);
      res.status(500).json({
        success: false,
        message: "Error al crear artículo",
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, autor, contenido, estatus } = req.body;

      // 🧩 Validar que haya datos
      if (!titulo && !autor && !contenido && !estatus && !req.files) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      // 📁 Verificar que el registro exista
      const registroActual = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      // 🕓 Actualizar fecha de modificación
      const moment = require("moment-timezone");
      const fechaLocal = moment
        .tz(new Date(), "America/Mexico_City")
        .format("YYYY-MM-DDTHH:mm:ss");

      const tempPath = path.join(backendPublicPath, 'articulos', 'temp');
      const baseFolder = path.join(backendPublicPath, 'articulos', id.toString());
      const imagenFolder = path.join(baseFolder, 'imagen');
      const archivoFolder = path.join(baseFolder, 'archivo');
      
      fs.mkdirSync(imagenFolder, { recursive: true });
      fs.mkdirSync(archivoFolder, { recursive: true });

      // 🧾 Campos actualizables
      const camposActualizados = {
        titulo,
        autor,
        contenido,
        estatus,
        fecha_modificacion: fechaLocal
      };

      // 📂 Manejar imagen si viene una nueva
      if (req.files?.imagen) {
        const nuevaImagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, nuevaImagen.filename);
        const newPath = path.join(imagenFolder, nuevaImagen.filename);

        // Eliminar imagen anterior (si existe)
        if (registroActual.imagen) {
          const imagenAnterior = path.join(imagenFolder, registroActual.imagen);
          if (fs.existsSync(imagenAnterior)) {
            fs.unlinkSync(imagenAnterior);
          }
        }

        fs.renameSync(oldPath, newPath);
        camposActualizados.imagen = nuevaImagen.filename;
      }

      // 📂 Manejar archivo PDF si viene uno nuevo
      if (req.files?.archivo) {
        const nuevoArchivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, nuevoArchivo.filename);
        const newPath = path.join(archivoFolder, nuevoArchivo.filename);

        // Eliminar archivo anterior (si existe)
        if (registroActual.archivo) {
          const archivoAnterior = path.join(archivoFolder, registroActual.archivo);
          if (fs.existsSync(archivoAnterior)) {
            fs.unlinkSync(archivoAnterior);
          }
        }

        fs.renameSync(oldPath, newPath);
        camposActualizados.archivo = nuevoArchivo.filename;
      }

      // 🔄 Actualizar BD
      await ArticulosModel.update(TABLE_NAME, id, camposActualizados, ID_COLUMN);

      res.status(200).json({
        success: true,
        message: "Artículo actualizado correctamente",
        data: camposActualizados,
      });
    } catch (err) {
      console.error("💥 Error en update articulos:", err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar artículo",
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 🔍 Verificar existencia
      const registro = await ArticulosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado o ya fue eliminado",
        });
      }

      // 🗂️ Borrar carpeta completa del artículo
      const baseFolder = path.join(backendPublicPath, 'articulos', id.toString());
      if (fs.existsSync(baseFolder)) {
        fs.rmSync(baseFolder, { recursive: true, force: true });
      }

      // 🧾 Eliminar registro en la BD
      await ArticulosModel.delete(TABLE_NAME, id, ID_COLUMN);

      res.status(200).json({
        success: true,
        message: "Artículo eliminado correctamente",
      });
    } catch (err) {
      console.error("💥 Error al eliminar artículo:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = ArticulosController;
