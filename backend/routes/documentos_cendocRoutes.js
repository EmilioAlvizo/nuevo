// nuevo/backend/routes/documentos_cendocRoutes.js

const express = require("express");
const router = express.Router();
const Documentos_cendocController = require("../controllers/documentos_cendocController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Rutas del API REST

// ✅ NUEVO - GET con filtros (DEBE IR ANTES de /:id)
router.get("/documentos_cendoc/filtrados", Documentos_cendocController.getFiltrados);

// ✅ NUEVO - GET conteos por municipio
router.get("/documentos_cendoc/conteos-documentos_cendoc", Documentos_cendocController.getConteosDocumentos_cendoc);

// GET - Obtener todos los registros
router.get("/documentos_cendoc", Documentos_cendocController.getAll);

// GET - Obtener un registro por ID
router.get("/documentos_cendoc/:id", Documentos_cendocController.getById);

// POST - Crear un nuevo registro
router.post("/documentos_cendoc", Documentos_cendocController.create);

// PUT - Actualizar un registro
router.put("/documentos_cendoc/:id", Documentos_cendocController.update);

// DELETE - Eliminar un registro
router.delete("/documentos_cendoc/:id", Documentos_cendocController.delete);

module.exports = router;