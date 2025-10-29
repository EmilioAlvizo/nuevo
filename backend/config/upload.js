const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Función para generar nombre único
function generarNombreArchivo(originalname) {
  const timestamp = Date.now();
  const ext = path.extname(originalname);
  return `${timestamp}_${Math.random().toString(36).substr(2, 10)}${ext}`;
}

// Configuración storage dinámico
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Debemos esperar a que la revista ya tenga un ID
    const idRevista = req.params.id || 'temp';
    let folder = '';
    
    if (file.fieldname === 'portada') {
      folder = `public/revistas/${idRevista}/portadas`;
    } else if (file.fieldname === 'archivo') {
      folder = `public/revistas/${idRevista}/archivos`;
    }

    fs.mkdirSync(folder, { recursive: true }); // crear carpeta si no existe
    cb(null, folder);
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
