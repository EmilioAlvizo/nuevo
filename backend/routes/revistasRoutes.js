// nuevo/backend/routes/revistasRoutes.js

const express = require("express");
const router = express.Router();
const RevistasController = require("../controllers/revistasController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/revistas", RevistasController.getAll);

// GET - Obtener un registro por ID
router.get("/revistas/:id", RevistasController.getById);

// POST - Crear un nuevo registro
router.post("/revistas", RevistasController.create);

// PUT - Actualizar un registro
router.put("/revistas/:id", RevistasController.update);

// DELETE - Eliminar un registro
router.delete("/revistas/:id", RevistasController.delete);

module.exports = router;