const Propuestas_accionModel = require("../models/propuestas_accionModel");

// Nombre de la tabla (cámbialo según tu tabla)
const TABLE_NAME = "propuesta_accion"; // 👈 CAMBIAR POR EL NOMBRE DE TU TABLA
const ID_COLUMN = "id_propuesta"; // 👈 CAMBIAR SI TU COLUMNA ID TIENE OTRO NOMBRE

// ========================================
// 🛡️ FUNCIONES DE VALIDACIÓN (Reutilizables)
// ========================================

function sanitizeString(str, maxLength = 4000) {
  if (!str) return ""; // Si es null o undefined, devuelve vacío
  return str
    .toString()
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "") // Eliminar HTML
    .replace(/[<>\"']/g, "") // Eliminar comillas y < >
    .replace(/\s+/g, " "); // Quitar espacios dobles
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarPropuestaPublica(data) {
  const errores = [];

  // Validaciones obligatorias (ajusta según tu lógica)
  if (!data.nombreC || data.nombreC.length < 3)
    errores.push("El nombre es muy corto");
  if (!data.correo || !validarEmail(data.correo))
    errores.push("Correo inválido");
  if (!data.id_municipio || isNaN(data.id_municipio))
    errores.push("Selecciona un municipio válido");

  // Validar que al menos escriban algo en alguno de los campos de texto
  if (!data.detalle && !data.justificacion && !data.necesidades) {
    errores.push(
      "Debes llenar al menos el detalle, justificación o necesidades"
    );
  }

  return { valido: errores.length === 0, errores };
}

class Propuestas_accionController {
  // ========================================
  // 🌐 MÉTODOS PÚBLICOS
  // ========================================

  // Crear desde formulario web público
  static async createPublico(req, res) {
    try {
      console.log("📥 Datos recibidos:", req.body);

      // 1. DESESTRUCTURACIÓN
      // Extraemos solo lo que nos interesa del body
      const {
        nombreC,
        sexo,
        edad,
        actividad,
        correo,
        id_municipio,
        zona,
        detalle,
        justificacion,
        necesidades,
      } = req.body;

      // 2. SANITIZACIÓN Y MAPEO EXACTO A LA BD
      // Creamos un objeto que coincida 100% con tus columnas
      const datosLimpios = {
        nombreC: sanitizeString(nombreC, 255),
        sexo: sanitizeString(sexo, 50),
        edad: parseInt(edad) || 0, // Si no es número, pone 0
        actividad: sanitizeString(actividad, 100),
        correo: sanitizeString(correo, 150).toLowerCase(),
        id_municipio: parseInt(id_municipio),
        zona: sanitizeString(zona, 50),
        detalle: sanitizeString(detalle, 4000), // Texto largo
        justificacion: sanitizeString(justificacion, 4000), // Texto largo
        necesidades: sanitizeString(necesidades, 4000), // Texto largo
        // fecha_registro: NO LA ENVIAMOS, dejamos que SQL Server ponga la fecha actual (GETDATE)
      };

      // 3. VALIDACIÓN
      const validacion = validarPropuestaPublica(datosLimpios);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: "Datos faltantes o incorrectos",
          errores: validacion.errores,
        });
      }

      // 4. GUARDAR EN BD
      // Nota: No enviamos 'estatus' porque no vi esa columna en tu tabla.
      // Si la tienes, agrégala aquí. Si no, así está bien.
      const nuevaPropuesta = await Propuestas_accionModel.create(
        TABLE_NAME,
        datosLimpios
      );

      res.status(201).json({
        success: true,
        message: "Propuesta registrada exitosamente.",
        data: nuevaPropuesta,
      });
    } catch (error) {
      console.error("❌ Error al crear propuesta:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  }

  // ========================================
  // 🔒 MÉTODOS PROTEGIDOS (ADMIN)
  // ========================================

  // GET - Obtener todos los registros
  static async getAll(req, res) {
    try {
      const propuesta = await Propuestas_accionModel.getAll(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: propuesta,
        count: propuesta.length,
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
      const propuesta = await Propuestas_accionModel.getById(
        TABLE_NAME,
        id,
        ID_COLUMN
      );

      if (!propuesta) {
        return res.status(404).json({
          success: false,
          message: "Registro no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: propuesta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo registro
  // static async create(req, res) {
  //   try {
  //     const data = req.body;

  //     if (!data || Object.keys(data).length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Datos inválidos o vacíos`,
  //       });
  //     }

  //     const newPropuesta = await Propuestas_accionModel.create(TABLE_NAME, data);

  //     // Si el modelo solo devuelve insertId, construimos el objeto completo
  //     const responseData = {
  //       id_propuesta: newPropuesta.insertId || newPropuesta.id_propuesta || newPropuesta,
  //       ...data
  //     };

  //     res.status(201).json({
  //       success: true,
  //       message: "Registro creado exitosamente",
  //       data: responseData, // ← Ahora siempre incluye id_propuesta
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }

  static async create(req, res) {
    try {
      const data = req.body;

      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: `Datos inválidos o vacíos`,
        });
      }

      const newPropuesta = await Propuestas_accionModel.create(
        TABLE_NAME,
        data
      );

      // ✅ Extraer SOLO el ID numérico
      let idPropuesta = null;

      if (typeof newPropuesta === "number") {
        // Si el modelo devuelve directamente el ID
        idPropuesta = newPropuesta;
      } else if (typeof newPropuesta === "object") {
        // Si devuelve un objeto, extraer el ID
        idPropuesta =
          newPropuesta.insertId || newPropuesta.id_propuesta || newPropuesta.id;
      }

      // Validar que tenemos un ID válido
      if (!idPropuesta || isNaN(Number(idPropuesta))) {
        console.error("❌ No se pudo extraer ID de:", newPropuesta);
        return res.status(500).json({
          success: false,
          message: "Error al obtener ID de la propuesta creada",
        });
      }

      const responseData = {
        id_propuesta: Number(idPropuesta), // ✅ Asegurar que sea número
        ...data,
      };

      res.status(201).json({
        success: true,
        message: "Registro creado exitosamente",
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
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

      const updatedPropuesta = await Propuestas_accionModel.update(
        TABLE_NAME,
        id,
        data,
        ID_COLUMN
      );
      res.status(200).json({
        success: true,
        message: "Registro actualizado exitosamente",
        data: updatedPropuesta,
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
      const result = await Propuestas_accionModel.delete(
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
  }
}

module.exports = Propuestas_accionController;
