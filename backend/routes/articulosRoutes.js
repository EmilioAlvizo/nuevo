// nuevo/backend/routes/articulosRoutes.js

const express = require("express");
const router = express.Router();
const ArticulosController = require("../controllers/articulosController");

//autenticacion
// const { authMiddleware, checkRole } = require("../middleware/authMiddleware");


// GET - Obtener todos los registros
router.get("/articulos", ArticulosController.getAll);

// GET - Obtener un registro por ID
router.get("/articulos/:id", ArticulosController.getById);

//POST - Crear un nuevo registro
router.post("/articulos", ArticulosController.create);


// PUT - Actualizar un registro
router.put("/articulos/:id", ArticulosController.update);

// DELETE - Eliminar un registro
router.delete("/articulos/:id", ArticulosController.delete);

module.exports = router;