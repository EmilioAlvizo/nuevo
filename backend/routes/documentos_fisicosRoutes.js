// nuevo/backend/routes/documentos_fisicosRoutes.js

const express = require("express");
const router = express.Router();
const Documentos_fisicosController = require("../controllers/documentos_fisicosController");
const { crearUpload } = require('../middleware/uploadMiddleware');

//autenticacion
// const { authMiddleware, checkRole } = require("../middleware/authMiddleware");


// Rutas del API REST

// ✅ NUEVO - GET con filtros (DEBE IR ANTES de /:id)
router.get("/documentos_fisicos/filtrados", Documentos_fisicosController.getFiltrados);

// ✅ NUEVO - GET conteos por municipio
//router.get("/documentos_fisicos/conteos", Documentos_fisicosController.getConteosMunicipio);

// GET - Obtener todos los registros
router.get("/documentos_fisicos", Documentos_fisicosController.getAll);

// GET - Obtener un registro por ID
router.get("/documentos_fisicos/:id", Documentos_fisicosController.getById);


// Crear middleware específico para documentos_fisicos
/* const uploadDocumentos_fisicos = crearUpload('documentos_fisicos', {
  portada: ['image/*'],
  archivo: ['application/pdf']
});

//POST - Crear registro
router.post('/documentos_fisicos', uploadDocumentos_fisicos.fields([
  { name: 'portada', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), Documentos_fisicosController.create);

//PUT - Actualizar registro
router.put('/documentos_fisicos/:id', uploadDocumentos_fisicos.fields([
  { name: 'portada', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]), Documentos_fisicosController.update); */

// DELETE - Eliminar un registro
router.delete("/documentos_fisicos/:id", Documentos_fisicosController.delete);


module.exports = router;