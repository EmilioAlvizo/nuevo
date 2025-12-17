//nuevo/backend/controllers/documentos_cendocController.js
const Documentos_cendocModel = require("../models/documentos_cendocModel");
const {
  parseArrayParam,
  validarCamposRequeridos,
} = require("../utils/filters");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "documentos_cendoc"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_documento"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, "../public");

class Documentos_cendocController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const municipio = await Documentos_cendocModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: municipio,
        count: municipio.length,
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
      const revistas = await Documentos_cendocModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

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

  // ✅ NUEVO - GET con filtros
  static async getFiltrados(req, res) {
    try {
      const {
        // Paginación
        limite,
        pagina,

        // Búsqueda global
        busqueda,

        // Filtros de columna con matchMode
        id_documento,
        id_documento_matchMode,

        nombre_documento,
        nombre_documento_matchMode,

        autor_documento,
        autor_documento_matchMode,

        descripcion_documento,
        descripcion_documento_matchMode,

        id_categoria_cendoc,
        id_categoria_cendoc_matchMode,

        archivo_documento,
        archivo_documento_matchMode,

        palabras_clave,
        palabras_clave_matchMode,

        fecha_documento,
        fecha_documento_matchMode,

        fecha_modificacion,
        fecha_modificacion_matchMode,

        // Filtros multiselect (separados por coma)
        estatus_documento,
        nombre_categoria,

        // Ordenamiento
        sortField,
        sortOrder,
      } = req.query;

      // Procesar parámetros
      const params = {
        // Paginación
        limite: parseInt(limite) || 10,
        pagina: parseInt(pagina) || 1,

        // Búsqueda global
        busqueda: busqueda || null,

        // Filtros simples con matchMode
        id_documento: id_documento || null,
        id_documento_matchMode: id_documento_matchMode || "contains",

        nombre_documento: nombre_documento || null,
        nombre_documento_matchMode: nombre_documento_matchMode || "contains",

        autor_documento: autor_documento || null,
        autor_documento_matchMode: autor_documento_matchMode || "contains",

        descripcion_documento: descripcion_documento || null,
        descripcion_documento_matchMode:
          descripcion_documento_matchMode || "contains",

        id_categoria_cendoc: id_categoria_cendoc || null,
        id_categoria_cendoc_matchMode:
          id_categoria_cendoc_matchMode || "contains",

        archivo_documento: archivo_documento || null,
        archivo_documento_matchMode: archivo_documento_matchMode || "contains",

        palabras_clave: palabras_clave || null,
        palabras_clave_matchMode: palabras_clave_matchMode || "contains",

        /* nombre_categoria: nombre_categoria || null,
        nombre_categoria_matchMode: nombre_categoria_matchMode || "contains", */

        // Filtros de fecha con matchMode
        fecha_documento: fecha_documento || null,
        fecha_documento_matchMode: fecha_documento_matchMode || "dateIs",

        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",

        // Filtros multiselect - convertir strings separadas por coma a arrays
        estatus_documento: estatus_documento
          ? parseArrayParam(estatus_documento, "string")
          : [],
        nombre_categoria: nombre_categoria
          ? parseArrayParam(nombre_categoria, "string")
          : [],

        // Ordenamiento
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,
      };

      const resultado = await Documentos_cendocModel.getArchivosFiltrados(
        params
      );

      //console.log("resultados ", resultado)

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

  /// ✅ NUEVO - GET conteos por municipio
  static async getConteosDocumentos_cendoc(req, res) {
    try {
      const conteos =
        await Documentos_cendocModel.getConteosPorDocumentos_cendoc();
      res.status(200).json({
        success: true,
        data: conteos,
        count: conteos.length,
      });
    } catch (error) {
      console.error("Error en getConteosDocumentos_cendoc:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo registro
  static async create(req, res) {
    try {
      const {
        nombre_documento,
        autor_documento,
        descripcion_documento,
        id_categoria_cendoc,
        palabras_clave,
        fecha_documento,
        estatus_documento,
      } = req.body;

      // ✅ Validar campos requeridos
      validarCamposRequeridos(req.body, [
        "nombre_documento",
        "autor_documento",
        "descripcion_documento",
        "id_categoria_cendoc",
        "fecha_documento",
        //"palabras_clave",
        "estatus_documento",
      ]);

      // 🕓 Convertir fecha a horario local (CDMX)

      // Crear registro en BD
      const nuevoDoc = await Documentos_cendocModel.create(TABLE_NAME, {
        nombre_documento,
        autor_documento,
        descripcion_documento,
        id_categoria_cendoc,
        palabras_clave,
        fecha_documento,
        estatus_documento,
      });

      const id = nuevoDoc.id;

      // 2️⃣ Definir carpetas
      const tempPath = `${backendPublicPath}/documentos_cendoc/temp`;
      const baseFolder = `${backendPublicPath}/documentos_cendoc/${id}`;

      // const archivoFolder = path.join(baseFolder, 'archivo');
      fs.mkdirSync(baseFolder, { recursive: true });

      // 3️⃣ Mover archivo
      let archivoFinal = null;
      if (req.files && req.files.archivo && req.files.archivo[0]) {
        const archivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, archivo.filename);
        const newPath = path.join(baseFolder, archivo.filename);
        fs.renameSync(oldPath, newPath);
        archivoFinal = archivo.filename;
        //console.log("📂 Archivo movido a:", newPath);
      } else {
        console.warn("⚠️ No se recibió archivo en req.files.archivo");
      }

      // 4️⃣ Actualizar registro
      if (archivoFinal) {
        await Documentos_cendocModel.update(
          TABLE_NAME,
          id,
          { archivo_documento: archivoFinal },
          ID_COLUMN
        );
      }

      res.status(201).json({
        success: true,
        message: "Documento creado correctamente",
        data: { id, archivo_documento: archivoFinal },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Error al crear documento",
        error: err.message,
      });
    }
  }

  // 📌 PUT - Actualizar documento existente
  static async update(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;

      const registroActual = await Documentos_cendocModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      // 🧾 Campos actualizables
      const camposActualizados = {
        nombre_documento: data.nombre_documento,
        id_categoria_cendoc: data.id_categoria_cendoc,
        autor_documento: data.autor_documento,
        estatus_documento: data.estatus_documento,
        palabras_clave: data.palabras_clave,
        fecha_documento: data.fecha_documento,
        descripcion_documento: data.descripcion_documento,
      };

      // Actualizar campos de texto
      await Documentos_cendocModel.update(
        TABLE_NAME,
        id,
        camposActualizados,
        ID_COLUMN
      );

      // 🗃️ Manejar archivo nuevo solo si se subió
      if (req.files?.archivo) {
        const tempPath = `${backendPublicPath}/documentos_cendoc/temp`;
        const baseFolder = `${backendPublicPath}/documentos_cendoc/${id}`;
        fs.mkdirSync(baseFolder, { recursive: true });

        const archivo = req.files.archivo[0];
        const oldPath = path.join(tempPath, archivo.filename);
        const newPath = path.join(baseFolder, archivo.filename);

        // 🧹 Eliminar archivo anterior si existía
        if (registroActual.archivo_documento) {
          const archivoAnterior = path.join(
            baseFolder,
            registroActual.archivo_documento
          );
          if (fs.existsSync(archivoAnterior)) fs.unlinkSync(archivoAnterior);
        }

        fs.renameSync(oldPath, newPath);
        await Documentos_cendocModel.update(
          TABLE_NAME,
          id,
          {
            archivo_documento: archivo.filename,
          },
          ID_COLUMN
        );
      }

      res.json({
        success: true,
        message: "Documento actualizado correctamente",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar documento",
        error: err.message,
      });
    }
  }

  // 📌 DELETE - Eliminar documento y archivo
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const registro = await Documentos_cendocModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      const deleted = await Documentos_cendocModel.delete(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Error al eliminar registro",
        });
      }

      const carpeta = path.join(
        backendPublicPath,
        "documentos_cendoc",
        id.toString()
      );
      if (fs.existsSync(carpeta)) {
        fs.rmSync(carpeta, { recursive: true, force: true });
        console.log(`🗑️ Carpeta eliminada: ${carpeta}`);
      }

      res.json({
        success: true,
        message: "Documento y archivo eliminados correctamente",
        id,
      });
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = Documentos_cendocController;
