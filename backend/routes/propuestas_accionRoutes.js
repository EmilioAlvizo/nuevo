const express = require("express");
const router = express.Router();
const Propuestas_accionController = require("../controllers/propuestas_accionController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/propuestas", Propuestas_accionController.getAll);

// GET - Obtener un registro por ID
router.get("/propuestas/:id", Propuestas_accionController.getById);

// POST - Crear un nuevo registro
router.post("/propuestas", Propuestas_accionController.create);

// PUT - Actualizar un registro
router.put("/propuestas/:id", authMiddleware, Propuestas_accionController.update);

// DELETE - Eliminar un registro
router.delete("/propuestas/:id", authMiddleware, Propuestas_accionController.delete);

module.exports = router;