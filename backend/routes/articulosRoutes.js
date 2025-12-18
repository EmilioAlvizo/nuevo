//nuevo/backend/routes/articulosRoutes.js
const express = require('express');
const router = express.Router();
const ArticulosController = require('../controllers/articulosController');
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require("../middleware/authMiddleware");

// Configurar upload para esta tabla
const uploadArticulos = crearUpload('articulos', {
  imagen: ['image/*'],
  archivo: ['application/pdf']
});

// Rutas generadas automáticamente para: articulos

router.get('/', ArticulosController.getAll);
router.get('/filtrados', ArticulosController.getFiltrados);
router.get('/valores-unicos', ArticulosController.getValoresUnicos);
router.get('/:id', ArticulosController.getById);

// Rutas con carga de archivos
router.post('/', authMiddleware, uploadArticulos.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), ArticulosController.create);

router.put('/:id', authMiddleware, uploadArticulos.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), ArticulosController.update);

router.delete('/:id', authMiddleware, ArticulosController.delete);

module.exports = router;
