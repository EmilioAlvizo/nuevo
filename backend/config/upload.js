const multer = require('multer');
const path = require('path');
const fs = require('fs');

const angularPublicPath = path.join(__dirname, '../../frontend/public/revistas');


// Función para generar nombre único
function generarNombreArchivo(originalname) {
  const timestamp = Date.now();
  const ext = path.extname(originalname);
  return `${timestamp}_${Math.random().toString(36).substr(2, 10)}${ext}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempFolder = `${angularPublicPath}/temp`;
    // const tempFolder = path.join(angularPublicPath, 'temp');
    fs.mkdirSync(tempFolder, { recursive: true });
    cb(null, tempFolder);
  },
  filename: function (req, file, cb) {
    cb(null, generarNombreArchivo(file.originalname));
  }
});


const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'archivo' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten PDFs para archivo'));
    }
    if (file.fieldname === 'portada' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes para portada'));
    }
    cb(null, true);
  }
});

module.exports = upload;
