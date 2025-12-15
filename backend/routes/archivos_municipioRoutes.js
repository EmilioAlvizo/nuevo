//nuevo/backend/routes/archivos_municipioRoutes.js
const express = require('express');
const router = express.Router();
const ArchivosMunicipioController = require('../controllers/archivos_municipioController');
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Configurar upload para esta tabla
const uploadArchivosMunicipio = crearUpload('archivos_municipio', {
  'archivo': [
    'application/pdf'
  ]
});

// Rutas generadas automáticamente para: archivos_municipio

router.get('/', ArchivosMunicipioController.getAll);
router.get('/filtrados', ArchivosMunicipioController.getFiltrados);
router.get('/valores-unicos', ArchivosMunicipioController.getValoresUnicos);
router.get('/:id', ArchivosMunicipioController.getById);
router.post('/', authMiddleware, uploadArchivosMunicipio.fields([
  { name: 'archivo', maxCount: 1 }
]), ArchivosMunicipioController.create);
router.put('/:id', authMiddleware, uploadArchivosMunicipio.fields([
  { name: 'archivo', maxCount: 1 }
]), ArchivosMunicipioController.update);
router.delete('/:id', authMiddleware, ArchivosMunicipioController.delete);

module.exports = router;
