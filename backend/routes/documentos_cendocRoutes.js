//nuevo/backend/routes/documentos_cendocRoutes.js
const express = require('express');
const router = express.Router();
const DocumentosCendocController = require('../controllers/documentos_cendocController');
const { crearUpload } = require('../middleware/uploadMiddleware');

// Configurar upload para esta tabla
const uploadDocumentosCendoc = crearUpload('documentos_cendoc', {
  'archivo': [
    'application/pdf'
  ]
});

// Rutas generadas automáticamente para: documentos_cendoc

router.get('/', DocumentosCendocController.getAll);
router.get('/filtrados', DocumentosCendocController.getFiltrados);
router.get('/valores-unicos', DocumentosCendocController.getValoresUnicos);
router.get('/:id', DocumentosCendocController.getById);
router.post('/', uploadDocumentosCendoc.fields([
    { name: 'archivo', maxCount: 1 }
]), DocumentosCendocController.create);
router.put('/:id', uploadDocumentosCendoc.fields([
    { name: 'archivo', maxCount: 1 }
]), DocumentosCendocController.update);
router.delete('/:id', DocumentosCendocController.delete);

module.exports = router;
