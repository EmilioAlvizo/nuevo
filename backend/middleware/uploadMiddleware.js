const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Middleware escalable para subida de archivos.
 * 
 * @param {string} entityName - Nombre de la entidad (ej: 'revistas', 'archivos_municipio')
 * @param {Array} fields - Campos esperados (ej: [{ name: 'archivo', maxCount: 1 }, { name: 'portada', maxCount: 1 }])
 */
function createUploadMiddleware(entityName, fields) {
  const BASE_UPLOAD_PATH = path.join(__dirname, `../../frontend/public/${entityName}`);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Carpeta base para la entidad
      let folder = BASE_UPLOAD_PATH;

      // Si existe un id en la URL o body, usarlo para separar carpetas por registro
      const id = req.params.id || req.body.id || "temp";
      folder = path.join(folder, id.toString());

      // Subcarpetas por tipo de archivo
      if (file.fieldname === "portada") folder = path.join(folder, "portadas");
      if (file.fieldname === "archivo") folder = path.join(folder, "archivos");
      if (file.fieldname === "imagen") folder = path.join(folder, "imagenes");

      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },

    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}-${uniqueSuffix}${ext}`);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowed = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error(`Tipo no permitido: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });

  return upload.fields(fields);
}

module.exports = { createUploadMiddleware };
