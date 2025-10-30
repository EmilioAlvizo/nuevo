// nuevo/backend/routes/articulosRoutes.js

const express = require("express");
const router = express.Router();

const upload = require("../config/upload");


const ArticulosController = require("../controllers/articulosController");
// const { getRevista, crearRevista, actualizarRevista, eliminarRevista } = require('../controllers/revistasController');


//autenticacion
// const { authMiddleware, checkRole } = require("../middleware/authMiddleware");



// Rutas del API REST

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




// Crear revista con archivos
// router.post("/revistas", upload.fields([
//   { name: "archivo", maxCount: 1 },
//   { name: "portada", maxCount: 1 }
// ]), RevistasController.create);

// // Editar revista con archivos opcionales
// router.put("/revistas/:id", upload.fields([
//   { name: "archivo", maxCount: 1 },
//   { name: "portada", maxCount: 1 }
// ]), RevistasController.update);

module.exports = router;