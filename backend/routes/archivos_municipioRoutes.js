// nuevo/backend/routes/archivos_municipioRoutes.js
const express = require("express");
const router = express.Router();
const Archivos_municipioController = require("../controllers/archivos_municipioController");

//autenticacion

const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
// const { createUploadMiddleware } = require("../middleware/uploadMiddleware");

/* const uploadArchivos = createUploadMiddleware("archivos_municipio", [
  { name: "archivo", maxCount: 1 },
]) */

// Rutas del API REST

// ✅ NUEVO - GET con filtros (DEBE IR ANTES de /:id)
router.get("/archivos_municipio/filtrados", Archivos_municipioController.getFiltrados);

// ✅ NUEVO - GET conteos por municipio
router.get("/archivos_municipio/conteos", Archivos_municipioController.getConteosMunicipio);

// GET - Obtener todos los registros
router.get("/archivos_municipio", Archivos_municipioController.getAll);

// GET - Obtener un registro por ID
router.get("/archivos_municipio/:id", Archivos_municipioController.getById);

// POST - Crear un nuevo registro
//router.post("/archivos_municipio", uploadArchivos, Archivos_municipioController.create);

// PUT - Actualizar un registro
router.put("/archivos_municipio/:id", Archivos_municipioController.update);

// DELETE - Eliminar un registro
router.delete("/archivos_municipio/:id", Archivos_municipioController.delete);

module.exports = router;