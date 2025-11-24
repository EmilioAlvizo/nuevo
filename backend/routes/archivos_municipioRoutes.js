//nuevo/backend/routes/archivos_municipioRoutes.js
const express = require('express');
const router = express.Router();
const ArchivosMunicipioController = require('../controllers/archivos_municipioController');

// Rutas generadas automáticamente para: archivos_municipio

router.get('/', ArchivosMunicipioController.getAll);
router.get('/filtrados', ArchivosMunicipioController.getFiltrados);
router.get('/valores-unicos', ArchivosMunicipioController.getValoresUnicos);
router.get('/:id', ArchivosMunicipioController.getById);
router.post('/', ArchivosMunicipioController.create);
router.put('/:id', ArchivosMunicipioController.update);
router.delete('/:id', ArchivosMunicipioController.delete);

module.exports = router;
