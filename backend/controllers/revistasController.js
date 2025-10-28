const RevistasModel = require("../models/revistasModel");
const upload = require("../config/upload");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "revistas"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_revista"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

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

  

// static async create(req, res) {
//   try {
//     const { volumen, numero_year, descripcion, fecha, estatus } = req.body;

//     if (!volumen || !numero_year || !descripcion || !fecha || !estatus) {
//       return res.status(400).json({ success: false, message: "Datos incompletos" });
//     }

//     // 1️⃣ Crear revista en la BD
//     const newRevista = await RevistasModel.create(TABLE_NAME, {
//       volumen,
//       numero_year,
//       descripcion,
//       fecha,
//       estatus,
//       archivo: "",
//       portada: "",
//       fecha_modificacion: new Date()
//     });

//     const revistaId = newRevista.id;

//     // 2️⃣ Guardar rutas de archivos
//     // const archivosActualizados = {};

//     // if (req.files["portada"] && req.files["portada"][0]) {
//     //   archivosActualizados.portada = req.files["portada"][0].path.replace("public/", "");
//     // }

//     // if (req.files["archivo"] && req.files["archivo"][0]) {
//     //   archivosActualizados.archivo = req.files["archivo"][0].path.replace("public/", "");
//     // }




//     const archivosActualizados = {};

// if (req.files["portada"] && req.files["portada"][0]) {
//   archivosActualizados.portada = req.files["portada"][0].filename;
// }

// if (req.files["archivo"] && req.files["archivo"][0]) {
//   archivosActualizados.archivo = req.files["archivo"][0].filename;
// }


//     const updatedRevista = await RevistasModel.update(
//       TABLE_NAME,
//       revistaId,
//       archivosActualizados,
//       ID_COLUMN
//     );

//     return res.status(201).json({
//       success: true,
//       message: "Revista creada correctamente",
//       data: updatedRevista
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// }

static async create(req, res) {
  upload.fields([
    { name: "portada", maxCount: 1 },
    { name: "archivo", maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    try {
      // 1️⃣ Extraer datos del formulario
      const { volumen, numero_year, descripcion, fecha, estatus } = req.body;
      if (!volumen || !numero_year || !descripcion || !fecha || !estatus) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
      }

      // 2️⃣ Preparar nombres de archivos
      const portadaNombre = req.files["portada"]?.[0].filename || "";
      const archivoNombre = req.files["archivo"]?.[0].filename || "";

      // 3️⃣ Crear revista en BD
      const newRevista = await RevistasModel.create(TABLE_NAME, {
        volumen,
        numero_year,
        descripcion,
        fecha,
        estatus,
        portada: portadaNombre,
        archivo: archivoNombre,
        fecha_modificacion: new Date()
      });

      // 4️⃣ Renombrar carpeta temporal a la carpeta con ID (opcional)
      const revistaId = newRevista.id;
      req.revistaId = revistaId;

      const folders = [
        { tipo: "portadas", nombre: portadaNombre },
        { tipo: "archivos", nombre: archivoNombre }
      ];

      folders.forEach(f => {
        if (!f.nombre) return;
        const base = f.tipo === "portadas" ? "public/revistas_portadas" : "public/revistas_archivos";
        const tempPath = path.join(base, f.nombre); 
        const finalPath = path.join(base, String(revistaId), f.nombre);
        fs.mkdirSync(path.join(base, String(revistaId)), { recursive: true });
        if (fs.existsSync(tempPath)) fs.renameSync(tempPath, finalPath);
      });

      res.status(201).json({ success: true, message: "Revista creada correctamente", data: newRevista });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}









  // PUT - Actualizar un registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos o vacíos",
        });
      }

      const updatedRevista = await RevistasModel.update(TABLE_NAME, id, data, ID_COLUMN);
      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updatedRevista,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE - Eliminar un registro
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await RevistasModel.delete(TABLE_NAME, id, ID_COLUMN);
      
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
  }
}

module.exports = RevistasController;