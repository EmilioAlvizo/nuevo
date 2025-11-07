const multer = require('multer');
const path = require('path');
const fs = require('fs');

const backendPublicPath = path.join(__dirname, '../public');

// Función para generar nombre único
function generarNombreArchivo(originalname) {
  const timestamp = Date.now();
  const ext = path.extname(originalname);
  return `${timestamp}_${Math.random().toString(36).substr(2, 10)}${ext}`;
}

/**
 * Crear middleware de upload genérico
 * @param {string} carpetaBase - Nombre de la carpeta base (ej: 'revistas', 'productos', 'usuarios')
 * @param {object} validaciones - Objeto con validaciones por campo
 * Ejemplo: { portada: ['image/*'], archivo: ['application/pdf'] }
 */
function crearUpload(carpetaBase, validaciones = {}) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const tempFolder = path.join(backendPublicPath, carpetaBase, 'temp');
      fs.mkdirSync(tempFolder, { recursive: true });
      cb(null, tempFolder);
    },
    filename: function (req, file, cb) {
      cb(null, generarNombreArchivo(file.originalname));
    }
  });

  const fileFilter = function (req, file, cb) {
    // Si hay validaciones definidas para este campo
    if (validaciones[file.fieldname]) {
      const tiposPermitidos = validaciones[file.fieldname];
      let valido = false;

      for (const tipo of tiposPermitidos) {
        if (tipo.endsWith('/*')) {
          // Validar tipo general (ej: 'image/*', 'video/*')
          const tipoBase = tipo.split('/')[0];
          if (file.mimetype.startsWith(tipoBase + '/')) {
            valido = true;
            break;
          }
        } else {
          // Validar tipo específico (ej: 'application/pdf')
          if (file.mimetype === tipo) {
            valido = true;
            break;
          }
        }
      }

      if (!valido) {
        return cb(new Error(`Tipo de archivo no permitido para ${file.fieldname}. Se esperaba: ${tiposPermitidos.join(', ')}`));
      }
    }

    cb(null, true);
  };

  return multer({ storage, fileFilter });
}

module.exports = { crearUpload, backendPublicPath };