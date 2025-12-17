// nuevo/backend/controller/testimoniosController.js
const TestimoniosModel = require("../models/testimoniosModel");

const TABLE_NAME = "testimonios";
const ID_COLUMN = "id_testimonios";

const path = require("path");
const fs = require("fs");
const backendPublicPath = path.join(__dirname, '../public');

// ========================================
// 🛡️ FUNCIONES DE VALIDACIÓN Y SANITIZACIÓN
// ========================================

/**
 * Sanitiza un string eliminando caracteres peligrosos
 */
function sanitizeString(str, maxLength = 500) {
  if (!str) return '';
  
  return str
    .toString()
    .trim()
    .slice(0, maxLength)
    // Eliminar HTML tags
    .replace(/<[^>]*>/g, '')
    // Eliminar caracteres especiales peligrosos
    .replace(/[<>\"']/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ');
}

/**
 * Valida email con regex
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida teléfono (solo números, espacios, guiones, paréntesis)
 */
function validarTelefono(telefono) {
  const regex = /^[\d\s\-\(\)\+]+$/;
  return regex.test(telefono) && telefono.replace(/\D/g, '').length >= 10;
}

/**
 * Valida y sanitiza los datos del testimonio público
 */
function validarTestimonioPublico(data) {
  const errores = [];

  // Validar nombre
  if (!data.nombreM || data.nombreM.trim().length < 3) {
    errores.push('El nombre debe tener al menos 3 caracteres');
  }
  if (data.nombreM && data.nombreM.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres');
  }

  // Validar correo
  if (!data.correo || !validarEmail(data.correo)) {
    errores.push('Debe proporcionar un correo electrónico válido');
  }

  // Validar teléfono
  if (!data.telefono || !validarTelefono(data.telefono)) {
    errores.push('Debe proporcionar un teléfono válido (mínimo 10 dígitos)');
  }

  // Validar descripción
  if (!data.descripcion || data.descripcion.trim().length < 10) {
    errores.push('La descripción debe tener al menos 10 caracteres');
  }
  if (data.descripcion && data.descripcion.length > 500) {
    errores.push('La descripción no puede exceder 500 caracteres');
  }

  // Validar municipio
  if (!data.id_municipio || isNaN(parseInt(data.id_municipio))) {
    errores.push('Debe seleccionar un municipio válido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

class TestimoniosController {

  // ========================================
  // 🌐 MÉTODOS PÚBLICOS (sin autenticación)
  // ========================================

  /**
   * GET - Obtener solo testimonios activos (para mostrar públicamente)
   */
  static async getPublicos(req, res) {
    try {
      const testimonios = await TestimoniosModel.getActivos(TABLE_NAME);
      res.status(200).json({
        success: true,
        data: testimonios,
        count: testimonios.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener testimonios',
      });
    }
  }

  /**
   * POST - Crear testimonio público (CON VALIDACIONES ESTRICTAS)
   * ✅ Retorna el ID correctamente para notificaciones
   */
  static async createPublico(req, res) {
    try {
      const { nombreM, id_municipio, correo, telefono, descripcion } = req.body;

      // 1. Validar y sanitizar datos
      const datosLimpios = {
        nombreM: sanitizeString(nombreM, 100),
        id_municipio: parseInt(id_municipio),
        correo: sanitizeString(correo, 100).toLowerCase(),
        telefono: sanitizeString(telefono, 20),
        descripcion: sanitizeString(descripcion, 500)
      };

      const validacion = validarTestimonioPublico(datosLimpios);
      
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errores: validacion.errores
        });
      }

      // 2. Validar tamaño de imagen si existe
      if (req.files?.imagenT) {
        const imagen = req.files.imagenT[0];
        const maxSize = 2 * 1024 * 1024; // 2MB
        
        if (imagen.size > maxSize) {
          // Eliminar archivo temporal
          fs.unlinkSync(imagen.path);
          return res.status(400).json({
            success: false,
            message: 'La imagen no debe exceder 2MB'
          });
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(imagen.mimetype)) {
          fs.unlinkSync(imagen.path);
          return res.status(400).json({
            success: false,
            message: 'Solo se permiten imágenes JPG, PNG o WebP'
          });
        }
      }

      // 3. Crear testimonio con estatus INACTIVO por defecto
      const nuevoTestimonio = await TestimoniosModel.create(TABLE_NAME, {
        ...datosLimpios,
        estatus: 'B' // ⚠️ INACTIVO por defecto para moderación
      });

      // 🔥 Extraer ID de manera robusta
      const id =
        nuevoTestimonio.insertId ||
        nuevoTestimonio.id_testimonios ||
        nuevoTestimonio.id ||
        (Array.isArray(nuevoTestimonio) ? nuevoTestimonio[0]?.id_testimonios : undefined);

      if (!id) {
        throw new Error('No se pudo obtener el ID del nuevo testimonio');
      }

      console.log('✅ Testimonio público creado con ID:', id);

      // 4. Manejar imagen si existe
      const tempPath = `${backendPublicPath}/testimonios/temp`;
      const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
      fs.mkdirSync(imagenFolder, { recursive: true });

      let imagenFilename = null;

      if (req.files?.imagenT) {
        const imagen = req.files.imagenT[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);
        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;

        await TestimoniosModel.update(
          TABLE_NAME,
          id,
          { imagenT: imagenFilename },
          ID_COLUMN
        );
      }

      // 🎯 RESPUESTA OPTIMIZADA PARA NOTIFICACIONES
      // Retorna el ID en un formato consistente y fácil de extraer
      res.status(201).json({
        success: true,
        message: 'Testimonio enviado correctamente. Será revisado por un administrador.',
        data: {
          id_testimonios: id, // ✅ ID en formato estándar
          nombreM: datosLimpios.nombreM,
          mensaje: 'Tu testimonio está pendiente de aprobación'
        }
      });

    } catch (err) {
      console.error('❌ Error al crear testimonio público:', err);
      
      // Limpiar archivos temporales en caso de error
      if (req.files?.imagenT) {
        try {
          const tempPath = `${backendPublicPath}/testimonios/temp`;
          const imagen = req.files.imagenT[0];
          const filePath = path.join(tempPath, imagen.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('Error al limpiar archivo temporal:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al enviar testimonio',
      });
    }
  }

  // ========================================
  // 🔒 MÉTODOS PROTEGIDOS (solo admin)
  // ========================================


  // GET - Obtener todos los testimonios
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

  // GET - Obtener un testimonio por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const testimonio = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

      if (!testimonio) {
        return res.status(404).json({
          success: false,
          message: "Testimonio no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: testimonio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST - Crear un nuevo testimonio (admin)
  static async create(req, res) {
    try {
      const { nombreM, id_municipio, correo, telefono, descripcion, estatus } = req.body;

      // Validación básica
      if (!nombreM || !id_municipio || !correo || !telefono || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos',
        });
      }

      // Guardar registro sin imagen primero
      const nuevoTestimonio = await TestimoniosModel.create(TABLE_NAME, {
        nombreM,
        id_municipio,
        correo,
        telefono,
        descripcion,
        estatus: estatus || 'B'
      });

      // Detectar correctamente el ID generado
      const id =
        nuevoTestimonio.insertId ||
        nuevoTestimonio.id_testimonios ||
        nuevoTestimonio.id ||
        (Array.isArray(nuevoTestimonio) ? nuevoTestimonio[0]?.id_testimonios : undefined);

      if (!id) {
        throw new Error('No se pudo obtener el ID del nuevo testimonio');
      }

      const tempPath = `${backendPublicPath}/testimonios/temp`;
      const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
      fs.mkdirSync(imagenFolder, { recursive: true });

      let imagenFilename = null;

      // Mover la imagen si existe
      if (req.files?.imagenT) {
        const imagen = req.files.imagenT[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);
        fs.renameSync(oldPath, newPath);
        imagenFilename = imagen.filename;
      }

      // Actualizar campo imagen en BD si aplica
      if (imagenFilename) {
        await TestimoniosModel.update(
          TABLE_NAME,
          id,
          { imagenT: imagenFilename },
          ID_COLUMN
        );
      }

      // Obtener el registro completo después de insertar
      const testimonioFinal = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Testimonio creado correctamente',
        data: testimonioFinal,
      });
    } catch (err) {
      console.error('Error al crear testimonio:', err);
      res.status(500).json({
        success: false,
        message: 'Error al crear testimonio',
        error: err.message,
      });
    }
  }

  // PUT - Actualizar un testimonio
  static async update(req, res) {
    try {
      const id = req.params.id;
      const { nombreM, id_municipio, correo, telefono, descripcion, estatus } = req.body;

      const registroActual = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);
      if (!registroActual) {
        return res.status(404).json({
          success: false,
          message: 'Testimonio no encontrado',
        });
      }

      // Actualizar datos básicos
      await TestimoniosModel.update(
        TABLE_NAME,
        id,
        { nombreM, id_municipio, correo, telefono, descripcion, estatus },
        ID_COLUMN
      );

      const tempPath = `${backendPublicPath}/testimonios/temp`;
      const imagenFolder = `${backendPublicPath}/testimonios/${id}`;
      fs.mkdirSync(imagenFolder, { recursive: true });

      let imagenFilename = registroActual.imagenT;

      // Procesar nueva imagen si existe
      if (req.files?.imagenT) {
        const imagen = req.files.imagenT[0];
        const oldPath = path.join(tempPath, imagen.filename);
        const newPath = path.join(imagenFolder, imagen.filename);

        // Borrar imagen anterior si existe
        if (registroActual.imagenT) {
          const imagenAnterior = path.join(imagenFolder, registroActual.imagenT);
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

      // Obtener el registro final actualizado
      const testimonioActualizado = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);

      res.json({
        success: true,
        message: 'Testimonio actualizado correctamente',
        data: testimonioActualizado,
      });
    } catch (err) {
      console.error('Error al actualizar testimonio:', err);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar testimonio',
        error: err.message,
      });
    }
  }

  // DELETE - Eliminar un testimonio y sus archivos
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener el registro antes de eliminarlo
      const registro = await TestimoniosModel.getById(TABLE_NAME, id, ID_COLUMN);
      
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: "Testimonio no encontrado",
        });
      }

      // Eliminar el registro de la base de datos
      const deleted = await TestimoniosModel.delete(TABLE_NAME, id, ID_COLUMN);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Error al eliminar el testimonio",
        });
      }

      // Eliminar carpeta completa del testimonio (con todos sus archivos)
      const carpetaTestimonio = path.join(backendPublicPath, 'testimonios', id.toString());
      
      if (fs.existsSync(carpetaTestimonio)) {
        fs.rmSync(carpetaTestimonio, { recursive: true, force: true });
        //console.log(`Carpeta eliminada: ${carpetaTestimonio}`);
      }

      res.status(200).json({
        success: true,
        message: 'Testimonio e imagen eliminados correctamente',
        id: deleted.id,
      });
    } catch (error) {
      console.error('Error al eliminar testimonio:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = TestimoniosController;
