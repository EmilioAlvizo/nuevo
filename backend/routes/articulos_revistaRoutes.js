//nuevo/backend/routes/articulos_revistaRoutes.js
const express = require('express');
const router = express.Router();
const ArticulosRevistaController = require('../controllers/articulos_revistaController');
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require("../middleware/authMiddleware");

// Configurar upload para esta tabla
const uploadArticulosRevista = crearUpload('articulos', {
  imagen: [
    'image/*'
  ]
});

// Rutas generadas automáticamente para: articulos_revista

router.get('/', ArticulosRevistaController.getAll);
router.get('/filtrados', ArticulosRevistaController.getFiltrados);
router.get('/valores-unicos', ArticulosRevistaController.getValoresUnicos);
router.get('/:id', ArticulosRevistaController.getById);

// Rutas con carga de archivos
router.post('/', authMiddleware, uploadArticulosRevista.fields([
  { name: 'imagen', maxCount: 1 }
]), ArticulosRevistaController.create);

router.put('/:id', authMiddleware, uploadArticulosRevista.fields([
  { name: 'imagen', maxCount: 1 }
]), ArticulosRevistaController.update);

router.delete('/:id', authMiddleware, ArticulosRevistaController.delete);

module.exports = router;
