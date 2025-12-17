//archivos_municipioController.js

const Archivos_municipioModel = require("../models/archivos_municipioModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "archivos_municipio"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_archivo"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

class Archivos_municipioController {
  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const municipio = await Archivos_municipioModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: municipio,
        total: municipio.length,
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
        nombre_archivo,
        nombre_archivo_matchMode,

        subcategoria,
        subcategoria_matchMode,

        palabras_clave,
        palabras_clave_matchMode,

        fecha_archivo,
        fecha_archivo_matchMode,

        fecha_modificacion,
        fecha_modificacion_matchMode,

        // Filtros multiselect (separados por coma)
        municipios,
        tipos,
        categorias,
        estatus,

        // Ordenamiento
        sortField,
        sortOrder,
      } = req.query;
      
      // Procesar parámetros
      const params = {
        // Paginación
        limite: parseInt(limite) || 50,
        pagina: parseInt(pagina) || 1,

        // Búsqueda global
        busqueda: busqueda || null,

        // Filtros simples con matchMode
        nombre_archivo: nombre_archivo || null,
        nombre_archivo_matchMode: nombre_archivo_matchMode || "contains",

        subcategoria: subcategoria || null,
        subcategoria_matchMode: subcategoria_matchMode || "contains",

        palabras_clave: palabras_clave || null,
        palabras_clave_matchMode: palabras_clave_matchMode || "contains",

        // Filtros de fecha con matchMode
        fecha_archivo: fecha_archivo || null,
        fecha_archivo_matchMode: fecha_archivo_matchMode || "dateIs",

        fecha_modificacion: fecha_modificacion || null,
        fecha_modificacion_matchMode: fecha_modificacion_matchMode || "dateIs",

        // Filtros multiselect - convertir strings separadas por coma a arrays
        municipios: municipios
          ? Archivos_municipioController.parseArrayParam(municipios, "int")
          : [],
        tipos: tipos
          ? Archivos_municipioController.parseArrayParam(tipos, "string")
          : [],
        categorias: categorias
          ? Archivos_municipioController.parseArrayParam(categorias, "string")
          : [],
        estatus: estatus
          ? Archivos_municipioController.parseArrayParam(estatus, "string")
          : [],

        // Ordenamiento
        sortField: sortField || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,
      };

      const resultado = await Archivos_municipioModel.getArchivosFiltrados(
        params
      );

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

  // 🛠️ Utilidad para parsear parámetros de array
  static parseArrayParam(param, type = "string") {
    console.log("func   ", param);
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

  // ✅ NUEVO - GET conteos por municipio
  static async getConteosMunicipio(req, res) {
    try {
      const conteos = await Archivos_municipioModel.getConteosPorMunicipio();
      res.status(200).json({
        success: true,
        data: conteos,
        total: conteos.length,
      });
    } catch (error) {
      console.error("Error en getConteosMunicipio:", error);
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
      const municipio = await Archivos_municipioModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      if (!municipio) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: municipio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // // POST - Crear un nuevo registro
  // static async create(req, res) {
  //   try {
  //     const data = req.body;
  //     const file = req.file;
  //     console.log("📥 Datos recibidos:", data);
  //     console.log("📎 Archivo recibido:", file?.filename);

  //     if (!data || Object.keys(data).length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Datos inválidos o vacíos",
  //       });
  //     }

  //     if (file) {
  //       data.archivo = file.filename;
  //     }

  //     const newMunicipio = await Archivos_municipioModel.create(
  //       TABLE_NAME,
  //       data
  //     );
  //     res.status(201).json({
  //       success: true,
  //       message: "Registro creado exitosamente",
  //       data: newMunicipio,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // } 
  // static async create(req, res) {
  //   try {
  //     const data = req.body;
  //     const file = req.file;

  //     // Convertir id_municipio a número
  //     if (data.id_municipio) {
  //       data.id_municipio = parseInt(data.id_municipio, 10);
  //     }

  //     console.log("📥 Datos recibidos:", data);
  //     console.log("📎 Archivo recibido:", file?.filename);

  //     const newMunicipio = await Archivos_municipioModel.create(
  //       TABLE_NAME,
  //       data
  //     );
  //     console.log("nuevo municipio", newMunicipio);

  //     const id = newMunicipio[ID_COLUMN];

  //     const baseFolder = path.join(BASE_PATH, id.toString());
  //     console.log("baseFolder: ", baseFolder);
  //     fs.mkdirSync(baseFolder, { recursive: true });

  //     const archivo = files?.archivo?.[0]?.filename || null;

  //     await Archivos_municipioModel.update(
  //       TABLE_NAME,
  //       id,
  //       { archivo },
  //       ID_COLUMN
  //     );

  //     res.status(201).json({ success: true, data: { id, archivo } });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  // static async create(req, res) {
  //   try {
  //     const {
  //       nombre_archivo,
  //       fecha_archivo,
  //       id_municipio,
  //       estatus_archivo,
  //       tipo_archivo,
  //       categoria_archivo,
  //       palabras_clave,
  //       subcategoria_archivo,
  //     } = req.body;

  //     // 🧩 Asegurar conversión a número
  //     const idMunicipio = id_municipio ? parseInt(id_municipio, 10) : null;

  //     console.log("📥 Datos recibidos:", req.body);
  //     console.log("📎 Archivos recibidos:", req.files);

  //     // 1️⃣ Crear el registro en la base de datos (sin archivo aún)
  //     const nuevoArchivo = await Archivos_municipioModel.create(TABLE_NAME, {
  //       nombre_archivo,
  //       fecha_archivo,
  //       id_municipio: idMunicipio,
  //       estatus_archivo,
  //       tipo_archivo,
  //       categoria_archivo,
  //       palabras_clave,
  //       subcategoria_archivo,
  //       archivo: null, // luego se actualizará
  //     });

  //     const id = nuevoArchivo.id_archivo;

  //     // 2️⃣ Definir carpetas base
  //     const tempPath = path.join(backendPublicPath, 'archivos_municipio', 'temp');
  //     const baseFolder = path.join(backendPublicPath, 'archivos_municipio', id.toString());
  //     const archivoFolder = path.join(baseFolder, 'archivo');

  //     // Crear las carpetas necesarias
  //     fs.mkdirSync(archivoFolder, { recursive: true });

  //     // 3️⃣ Mover archivo desde temp → carpeta definitiva
  //     let archivoFinal = null;
  //     if (req.files?.archivo && req.files.archivo[0]) {
  //       const archivo = req.files.archivo[0];
  //       const oldPath = path.join(tempPath, archivo.filename);
  //       const newPath = path.join(archivoFolder, archivo.filename);
  //       fs.renameSync(oldPath, newPath);
  //       archivoFinal = archivo.filename;
  //     }

  //     // 4️⃣ Actualizar el registro con el nombre del archivo final
  //     await Archivos_municipioModel.update(
  //       TABLE_NAME,
  //       id,
  //       { archivo: archivoFinal },
  //       ID_COLUMN
  //     );

  //     // 5️⃣ Responder al cliente
  //     res.status(201).json({
  //       success: true,
  //       message: "Archivo del municipio creado correctamente",
  //       data: { id, archivo: archivoFinal },
  //     });

  //   } catch (err) {
  //     console.error("💥 Error en create Archivos_municipio:", err);
  //     res.status(500).json({
  //       success: false,
  //       message: "Error al crear el archivo del municipio",
  //       error: err.message,
  //     });
  //   }
  // }

  
static async create(req, res) {
  try {
    const {
      nombre_archivo,
      fecha_archivo,
      id_municipio,
      estatus_archivo,
      tipo_archivo,
      categoria_archivo,
      palabras_clave,
      subcategoria_archivo,
    } = req.body;

    const idMunicipio = id_municipio ? parseInt(id_municipio, 10) : null;
    const fechaArchivo = fecha_archivo || new Date().toISOString().split('T')[0];

    //("📥 Datos recibidos:", req.body);
    //console.log("📎 Archivos recibidos:", req.files);

    // 1️⃣ Crear el registro
    const nuevoArchivo = await Archivos_municipioModel.create(TABLE_NAME, {
      nombre_archivo,
      fecha_archivo: fechaArchivo,
      id_municipio: idMunicipio,
      estatus_archivo,
      tipo_archivo,
      categoria_archivo,
      palabras_clave,
      subcategoria_archivo,
      archivo: null,
    });

    //console.log("🆕 Resultado create():", nuevoArchivo);
    const id = nuevoArchivo.id_archivo || nuevoArchivo.insertId || nuevoArchivo.id;
    if (!id) throw new Error("No se pudo obtener el ID del nuevo registro");

    // 2️⃣ Definir carpetas
    const tempPath = path.join(backendPublicPath, 'archivos_municipio', 'temp');
    const baseFolder = path.join(backendPublicPath, 'archivos_municipio', id.toString());
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
      await Archivos_municipioModel.update(TABLE_NAME, id, { archivo: archivoFinal }, ID_COLUMN);
    }

    res.status(201).json({
      success: true,
      message: "Archivo del municipio creado correctamente",
      data: { id, archivo: archivoFinal },
    });
  } catch (err) {
    console.error("💥 Error en create Archivos_municipio:", err);
    res.status(500).json({
      success: false,
      message: "Error al crear el archivo del municipio",
      error: err.message,
    });
  }
}
  

  // PUT - Actualizar un registro
  // static async update(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const data = req.body;

  //     if (!data || Object.keys(data).length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Datos inválidos o vacíos",
  //       });
  //     }

  //     const updatedMunicipio = await Archivos_municipioModel.update(
  //       TABLE_NAME,
  //       id,
  //       data,
  //       ID_COLUMN
  //     );
  //     res.status(200).json({
  //       success: true,
  //       message: "Registro actualizado exitosamente",
  //       data: updatedMunicpio,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }
  static async update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    // 🧩 Validar que haya datos
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos o vacíos",
      });
    }

    // 📁 Verificar que el registro exista
    const registro = await Archivos_municipioModel.getById(TABLE_NAME, id, ID_COLUMN);
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "El archivo del municipio no existe",
      });
    }

    const tempPath = path.join(backendPublicPath, 'archivos_municipio', 'temp');
    const baseFolder = path.join(backendPublicPath, 'archivos_municipio', id.toString());
    fs.mkdirSync(baseFolder, { recursive: true });

    // 🧾 Campos actualizables
    const camposActualizados = {
      nombre_archivo: data.nombre_archivo,
      id_municipio: data.id_municipio,
      estatus_archivo: data.estatus_archivo,
      tipo_archivo: data.tipo_archivo,
      categoria_archivo: data.categoria_archivo,
      palabras_clave: data.palabras_clave,
      subcategoria_archivo: data.subcategoria_archivo,
      fecha_archivo: data.fecha_archivo,
    };

    // 📂 Si se envía un nuevo archivo, reemplazar el anterior
    if (req.files && req.files.archivo && req.files.archivo[0]) {
      const nuevoArchivo = req.files.archivo[0];
      const oldPath = path.join(tempPath, nuevoArchivo.filename);
      const newPath = path.join(baseFolder, nuevoArchivo.filename);

      // Eliminar el archivo anterior (si existe)
      if (registro.archivo) {
        const archivoAnterior = path.join(baseFolder, registro.archivo);
        if (fs.existsSync(archivoAnterior)) {
          fs.unlinkSync(archivoAnterior);
          //console.log("🗑️ Archivo anterior eliminado:", archivoAnterior);
        }
      }

      // Mover el nuevo
      fs.renameSync(oldPath, newPath);
      camposActualizados.archivo = nuevoArchivo.filename;
      //console.log("📂 Nuevo archivo guardado en:", newPath);
    }

    // 🔄 Actualizar BD
    await Archivos_municipioModel.update(TABLE_NAME, id, camposActualizados, ID_COLUMN);

    res.status(200).json({
      success: true,
      message: "Archivo actualizado correctamente",
      data: camposActualizados,
    });
  } catch (error) {
    console.error("💥 Error en update Archivos_municipio:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


  // DELETE - Eliminar un registro
  /* static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await Archivos_municipioModel.delete(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } */
  // static async delete(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const deleted = await Archivos_municipioModel.delete(
  //       TABLE_NAME,
  //       id,
  //       ID_COLUMN
  //     );

  //     const dir = path.join(BASE_PATH, id.toString());
  //     console.log("direc ", dir);
  //     if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

  //     res
  //       .status(200)
  //       .json({ success: true, message: "archivo_municipio eliminado" });
  //   } catch (err) {
  //     res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  static async delete(req, res) {
  try {
    const { id } = req.params;

    // 🔍 Verificar existencia
    const registro = await Archivos_municipioModel.getById(TABLE_NAME, id, ID_COLUMN);
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: "El archivo del municipio no existe o ya fue eliminado",
      });
    }

    // 🗂️ Borrar carpeta del archivo físico
    const dir = path.join(backendPublicPath, 'archivos_municipio', id.toString());
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      //console.log("🗑️ Carpeta eliminada:", dir);
    }

    // 🧾 Eliminar registro en la BD
    await Archivos_municipioModel.delete(TABLE_NAME, id, ID_COLUMN);

    res.status(200).json({
      success: true,
      message: "Archivo del municipio eliminado correctamente",
    });
  } catch (error) {
    console.error("💥 Error en delete Archivos_municipio:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


}

module.exports = Archivos_municipioController;