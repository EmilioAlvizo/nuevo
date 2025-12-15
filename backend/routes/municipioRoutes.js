// nuevo/backend/routes/itemRoutes.js

const express = require("express");
const router = express.Router();
const MunicipioController = require("../controllers/municipioController");
//autenticacion
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/municipios", MunicipioController.getAll);

// GET - Obtener un registro por ID
router.get("/municipios/:id", MunicipioController.getById);

// POST - Crear un nuevo registro
router.post("/municipios", authMiddleware, MunicipioController.create);

// PUT - Actualizar un registro
router.put("/municipios/:id", authMiddleware, MunicipioController.update);

// DELETE - Eliminar un registro
router.delete("/municipios/:id", authMiddleware, MunicipioController.delete);

module.exports = router;