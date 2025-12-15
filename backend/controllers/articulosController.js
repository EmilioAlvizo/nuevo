//nuevo/backend/controllers/articulos_revistaController.js
const ArticulosRevistaModel = require("../models/articulosModel");
const { parseArrayParam, validarCamposRequeridos } = require("../utils/filters");

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");

const TABLE_NAME = "articulos_revista";
const ID_COLUMN = "id_articulo";

class ArticulosRevistaController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const data = await ArticulosRevistaModel.getAll(TABLE_NAME);
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
      const registro = await ArticulosRevistaModel.getById(TABLE_NAME, id, ID_COLUMN);

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
        // id_articulo
        id_articulo,
        id_articulo_matchMode,
        // id_revista
        id_revista,
        id_revista_matchMode,
        // titulo
        titulo,
        titulo_matchMode,
        // autor
        autor,
        autor_matchMode,
        // contenido
        contenido,
        contenido_matchMode,
        // estatus
        estatus,
        estatus_matchMode,
        // fecha_modificacion
        fecha_modificacion,
        fecha_modificacion_matchMode,
        // pagina_revista
        pagina_revista,
        pagina_revista_matchMode,
      } = req.query;

      const params = {
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,
        busqueda: busqueda || null,
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,

        id_articulo: id_articulo || null,
        id_articulo_matchMode: id_articulo_matchMode || "contains",
        id_revista: id_revista ? parseArrayParam(id_revista, "int") : [],
        id_revista_matchMode: id_revista_matchMode || "contains",
        titulo: titulo || null,
        titulo_matchMode: titulo_matchMode || "contains",
        autor: autor ? parseArrayParam(autor, "string") : [],
        contenido: contenido || null,
        contenido_matchMode: contenido_matchMode || "contains",
        estatus: estatus ? parseArrayParam(estatus, "string") : [],
        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",
        pagina_revista: pagina_revista || null,
        pagina_revista_matchMode: pagina_revista_matchMode || "contains",
      };

      const resultado = await ArticulosRevistaModel.getFiltrados(params);

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
      const valores = await ArticulosRevistaModel.getValoresUnicos();
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
      const data = req.body;
      if (data.id_revista === '') {
        data.id_revista = null;
      }

      // Validar campos requeridos
      validarCamposRequeridos(data, []);

      console.log("📥 Datos recibidos:", req.body);
      console.log("📎 Archivos recibidos:", req.files);

      // 1️⃣ Crear el registro primero (sin archivos)
      const nuevoRegistro = await ArticulosRevistaModel.create(TABLE_NAME, {
        ...data,
        imagen: null
      });

      console.log("🆕 Resultado create():", nuevoRegistro);
      const id = nuevoRegistro.id_articulo || nuevoRegistro.insertId || nuevoRegistro.id;
      if (!id) throw new Error("No se pudo obtener el ID del nuevo registro");

      // 2️⃣ Definir carpetas
      const tempPath = path.join(backendPublicPath, 'articulos', 'temp');
      const baseFolder = path.join(backendPublicPath, 'articulos', id.toString());
      fs.mkdirSync(baseFolder, { recursive: true });

      // 3️⃣ Procesar archivos
      const archivosActualizados = {};

      if (req.files && req.files.imagen && req.files.imagen[0]) {
        const imagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(baseFolder, imagen.filename);
        fs.renameSync(oldPath, newPath);
        archivosActualizados.imagen = imagen.filename;
        console.log("📂 imagen movido a:", newPath);
      } else {
        console.warn("⚠️ No se recibió archivo en req.files.imagen");
      }

      // 4️⃣ Actualizar registro con archivos
      if (Object.keys(archivosActualizados).length > 0) {
        await ArticulosRevistaModel.update(TABLE_NAME, id, archivosActualizados, ID_COLUMN);
      }

      res.status(201).json({
        success: true,
        message: "Registro creado correctamente",
        data: { id, ...archivosActualizados },
      });
    } catch (err) {
      console.error("💥 Error en create articulos_revista:", err);
      res.status(500).json({
        success: false,
        message: "Error al crear registro",
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      if (data.id_revista === '') {
        data.id_revista = null;
      }

      // 🧩 Validar que haya datos
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      // 📁 Verificar que el registro exista
      const registroActual = await ArticulosRevistaModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      const tempPath = path.join(backendPublicPath, 'articulos', 'temp');
      const baseFolder = path.join(backendPublicPath, 'articulos', id.toString());
      fs.mkdirSync(baseFolder, { recursive: true });

      // 🧾 Campos actualizables
      const camposActualizados = { ...data };

      // 📂 Si se envían nuevos archivos, reemplazar los anteriores
      if (req.files && req.files.imagen && req.files.imagen[0]) {
        const nuevoImagen = req.files.imagen[0];
        const oldPath = path.join(tempPath, nuevoImagen.filename);
        const newPath = path.join(baseFolder, nuevoImagen.filename);

        // Eliminar el archivo anterior (si existe)
        if (registroActual.imagen) {
          const archivoAnterior = path.join(baseFolder, registroActual.imagen);
          if (fs.existsSync(archivoAnterior)) {
            fs.unlinkSync(archivoAnterior);
            console.log("🗑️ Archivo anterior eliminado:", archivoAnterior);
          }
        }

        // Mover el nuevo
        fs.renameSync(oldPath, newPath);
        camposActualizados.imagen = nuevoImagen.filename;
        console.log("📂 Nuevo archivo guardado en:", newPath);
      }

      // 🔄 Actualizar BD
      await ArticulosRevistaModel.update(TABLE_NAME, id, camposActualizados, ID_COLUMN);

      res.status(200).json({
        success: true,
        message: "Registro actualizado correctamente",
        data: camposActualizados,
      });
    } catch (err) {
      console.error("💥 Error en update articulos_revista:", err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar registro",
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 🔍 Verificar existencia
      const registro = await ArticulosRevistaModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado o ya fue eliminado",
        });
      }

      // 🗂️ Borrar carpeta del archivo físico
      const dir = path.join(backendPublicPath, 'articulos', id.toString());
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("🗑️ Carpeta eliminada:", dir);
      }

      // 🧾 Eliminar registro en la BD
      await ArticulosRevistaModel.delete(TABLE_NAME, id, ID_COLUMN);

      res.status(200).json({
        success: true,
        message: "Registro eliminado correctamente",
      });
    } catch (err) {
      console.error("💥 Error al eliminar registro:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // 🛠️ Utilidad para parsear parámetros de array
  static parseArrayParam(param, type = "string") {
    if (!param) return [];

    // Si ya es un array, devolverlo
    if (Array.isArray(param)) {
      return type === "int" ? param.map(Number) : param;
    }

    // Si es un string, dividirlo por comas
    const arr = param
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return type === "int" ? arr.map(Number) : arr;
  }
}

module.exports = ArticulosRevistaController;
