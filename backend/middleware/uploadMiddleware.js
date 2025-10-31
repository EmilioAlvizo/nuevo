// nuevo/backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function createUploadMiddleware(entityName, fields) {
  const BASE_UPLOAD_PATH = path.join(__dirname, `../../frontend/public/${entityName}`);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const folder = path.join(BASE_UPLOAD_PATH, "temp");
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
