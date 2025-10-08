const express = require("express");
const router = express.Router();
const ItemController = require("../controllers/itemController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/items", ItemController.getAll);

// GET - Obtener un registro por ID
router.get("/items/:id", ItemController.getById);

// POST - Crear un nuevo registro
router.post("/items", ItemController.create);

// PUT - Actualizar un registro
router.put("/items/:id", ItemController.update);

// DELETE - Eliminar un registro
router.delete("/items/:id", ItemController.delete);

module.exports = router;