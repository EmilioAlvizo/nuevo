// nuevo/backend/routes/revistasRoutes.js

const express = require("express");
const router = express.Router();
const RevistasController = require("../controllers/revistasController");
const { crearUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Crear middleware específico para revistas
const uploadRevistas = crearUpload('revistas', {
  portada: ['image/*'],
  archivo: ['application/pdf']
});

// Rutas del API REST

// ✅ NUEVO - GET con filtros (DEBE IR ANTES de /:id)
router.get("/revistas/filtrados", RevistasController.getFiltrados);

// ✅ NUEVO - GET conteos por municipio
//router.get("/revistas/conteos", RevistasController.getConteosMunicipio);

// GET - Obtener todos los registros
router.get("/revistas", RevistasController.getAll);

// GET - Obtener un registro por ID
router.get("/revistas/:id", RevistasController.getById);


//POST - Crear registro
router.post('/revistas', authMiddleware, uploadRevistas.fields([
  { name: 'portada', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), RevistasController.create);

//PUT - Actualizar registro
router.put('/revistas/:id', authMiddleware, uploadRevistas.fields([
  { name: 'portada', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), RevistasController.update);

// DELETE - Eliminar un registro
router.delete("/revistas/:id", authMiddleware, RevistasController.delete);


module.exports = router;