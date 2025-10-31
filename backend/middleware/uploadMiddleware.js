// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// /**
//  * Middleware escalable para subida de archivos.
//  * 
//  * @param {string} entityName - Nombre de la entidad (ej: 'revistas', 'archivos_municipio')
//  * @param {Array} fields - Campos esperados (ej: [{ name: 'archivo', maxCount: 1 }, { name: 'portada', maxCount: 1 }])
//  */
// function createUploadMiddleware(entityName, fields) {
//   const BASE_UPLOAD_PATH = path.join(__dirname, `../../frontend/public/${entityName}`);

//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       // Carpeta base para la entidad
//       let folder = BASE_UPLOAD_PATH;

//       // Si existe un id en la URL o body, usarlo para separar carpetas por registro
//       const id = req.params.id || req.body.id || "temp";
//       folder = path.join(folder, id.toString());

//       // Subcarpetas por tipo de archivo
//       if (file.fieldname === "portada") folder = path.join(folder, "portadas");
//       if (file.fieldname === "archivo") folder = path.join(folder, "archivos");
//       if (file.fieldname === "imagen") folder = path.join(folder, "imagenes");

//       fs.mkdirSync(folder, { recursive: true });
//       cb(null, folder);
//     },

//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       const ext = path.extname(file.originalname);
//       const base = path.basename(file.originalname, ext);
//       cb(null, `${base}-${uniqueSuffix}${ext}`);
//     },
//   });

//   const upload = multer({
//     storage,
//     fileFilter: (req, file, cb) => {
//       const allowed = [
//         "application/pdf",
//         "image/jpeg",
//         "image/png",
//         "image/webp",
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       ];
//       if (!allowed.includes(file.mimetype)) {
//         return cb(new Error(`Tipo no permitido: ${file.mimetype}`));
//       }
//       cb(null, true);
//     },
//   });

//   return upload.fields(fields);
// }

// module.exports = { createUploadMiddleware };



const multer = require('multer');
const path = require('path');
const fs = require('fs');

const angularPublicPath = path.join(__dirname, '../../frontend/public');

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
      const tempFolder = path.join(angularPublicPath, carpetaBase, 'temp');
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

module.exports = { crearUpload, angularPublicPath };
