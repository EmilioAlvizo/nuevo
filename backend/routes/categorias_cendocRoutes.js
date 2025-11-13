const express = require("express");
const router = express.Router();
const CategoriasCendocController = require("../controllers/categorias_cendocController");
//autenticacion

// Rutas del API REST

// GET - Obtener todos los registros
router.get("/categorias_cendoc", CategoriasCendocController.getAll);

// GET - Obtener un registro por ID
router.get("/categorias_cendoc/:id", CategoriasCendocController.getById);

module.exports = router;